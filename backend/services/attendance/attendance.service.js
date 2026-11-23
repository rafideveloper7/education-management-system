const mongoose = require('mongoose');

const Attendance = require('../../models/attendance/Attendance');
const AcademicSession = require('../../models/academic/AcademicSession');
const AcademicClass = require('../../models/academic/Class');
const Section = require('../../models/academic/Section');
const StudentEnrollment = require('../../models/student/StudentEnrollment');
const TeacherAssignment = require('../../models/teacher/TeacherAssignment');
const ParentStudent = require('../../models/parent/ParentStudent');
const User = require('../../models/user/User');
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');
const { getDayBounds, isDateKey } = require('../../utils/attendanceDate');

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const encodeCursor = (record) => Buffer.from(JSON.stringify({
  version: 1,
  attendanceDate: record.attendanceDate,
  id: String(record._id),
})).toString('base64url');

const decodeCursor = (cursor) => {
  try {
    const payload = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (payload.version !== 1 || !OBJECT_ID_PATTERN.test(payload.id) || !isDateKey(payload.attendanceDate)) {
      throw new Error('Invalid cursor');
    }
    return payload;
  } catch (error) {
    throw new ApiError(400, 'cursor must be a valid attendance cursor', { code: 'INVALID_CURSOR' });
  }
};

const createAttendanceService = ({
  models = { Attendance, AcademicSession, AcademicClass, Section, StudentEnrollment, TeacherAssignment, ParentStudent, User },
  timeZone = env.academicTimeZone,
  runInTransaction = async (operation) => {
    const session = await mongoose.startSession();
    try {
      let result;
      await session.withTransaction(async () => { result = await operation(session); });
      return result;
    } finally {
      await session.endSession();
    }
  },
  now = () => new Date(),
} = {}) => {
  const requireObjectId = (value, field) => {
    if (!OBJECT_ID_PATTERN.test(String(value || ''))) throw new ApiError(400, `${field} must be a valid ObjectId`);
  };

  const requireAcademicContext = async ({ sectionId, academicSessionId, classId, attendanceDate }, { forMarking = false } = {}) => {
    const [session, academicClass, section] = await Promise.all([
      models.AcademicSession.findById(academicSessionId).lean(),
      models.AcademicClass.findById(classId).lean(),
      models.Section.findById(sectionId).lean(),
    ]);

    if (!session || !academicClass || !section || section.classId.toString() !== classId) {
      throw new ApiError(400, 'Academic session, class, and section must identify a valid matching context', {
        code: 'INVALID_ACADEMIC_CONTEXT',
      });
    }
    if (forMarking && (session.status !== 'ACTIVE' || academicClass.status !== 'ACTIVE' || section.status !== 'ACTIVE')) {
      throw new ApiError(409, 'Attendance can only be recorded for an active session, class, and section', {
        code: 'ACADEMIC_CONTEXT_INACTIVE',
      });
    }

    const startKey = new Date(session.startDate).toISOString().slice(0, 10);
    const endKey = new Date(session.endDate).toISOString().slice(0, 10);
    if (attendanceDate < startKey || attendanceDate > endKey) {
      throw new ApiError(400, 'attendanceDate must fall within the academic session dates', {
        code: 'DATE_OUTSIDE_ACADEMIC_SESSION',
      });
    }

    return { session, academicClass, section, day: getDayBounds(attendanceDate, timeZone) };
  };

  const requireTeacherAssignment = async (actor, context, day) => {
    if (actor.role === 'ADMIN') return;
    if (actor.role !== 'TEACHER') throw new ApiError(403, 'Only an administrator or assigned teacher can mark attendance');

    const assigned = await models.TeacherAssignment.exists({
      teacherUserId: actor.sub,
      academicSessionId: context.session._id,
      classId: context.academicClass._id,
      sectionId: context.section._id,
      status: { $in: ['ACTIVE', 'ENDED'] },
      validFrom: { $lte: day.end },
      $or: [{ validTo: null }, { validTo: { $gte: day.start } }],
    });
    if (!assigned) throw new ApiError(403, 'Teacher is not assigned to this section for the attendance date');
  };

  const markSectionAttendance = async ({ actor, sectionId, payload }) => {
    requireObjectId(actor?.sub, 'authenticated user');
    requireObjectId(sectionId, 'sectionId');
    const context = await requireAcademicContext({ sectionId, ...payload }, { forMarking: true });
    await requireTeacherAssignment(actor, context, context.day);

    const enrollmentIds = payload.records.map(({ enrollmentId }) => enrollmentId);
    const enrollments = await models.StudentEnrollment.find({
      _id: { $in: enrollmentIds },
      academicSessionId: context.session._id,
      classId: context.academicClass._id,
      sectionId: context.section._id,
      status: { $in: ['ACTIVE', 'COMPLETED', 'ENDED', 'SUSPENDED'] },
      validFrom: { $lte: context.day.end },
    }).lean();
    const validEnrollments = enrollments.filter((enrollment) => (
      !enrollment.validTo || enrollment.validTo >= context.day.start
    ));

    if (validEnrollments.length !== enrollmentIds.length) {
      throw new ApiError(400, 'Every attendance record must reference an enrollment valid for this section, session, and date', {
        code: 'INVALID_ATTENDANCE_ENROLLMENT',
      });
    }

    const existing = await models.Attendance.exists({
      enrollmentId: { $in: enrollmentIds },
      attendanceDate: payload.attendanceDate,
    });
    if (existing) throw new ApiError(409, 'Attendance has already been recorded for one or more enrollments on this date', {
      code: 'ATTENDANCE_ALREADY_RECORDED',
    });

    const enrollmentById = new Map(validEnrollments.map((record) => [String(record._id), record]));
    const records = payload.records.map(({ enrollmentId, status }) => ({
      studentUserId: enrollmentById.get(enrollmentId).studentUserId,
      enrollmentId,
      academicSessionId: context.session._id,
      classId: context.academicClass._id,
      sectionId: context.section._id,
      attendanceDate: payload.attendanceDate,
      status,
      markedBy: actor.sub,
      updatedBy: actor.sub,
    }));

    try {
      return await runInTransaction((session) => models.Attendance.insertMany(records, { session, ordered: true }));
    } catch (error) {
      if (error?.code === 11000) {
        throw new ApiError(409, 'Attendance has already been recorded for one or more enrollments on this date', {
          code: 'ATTENDANCE_ALREADY_RECORDED',
        });
      }
      throw error;
    }
  };

  const listRecords = async (filter, { limit = 50, cursor } = {}) => {
    const query = { ...filter };
    if (cursor) {
      const position = decodeCursor(cursor);
      query.$or = [
        { attendanceDate: { $lt: position.attendanceDate } },
        { attendanceDate: position.attendanceDate, _id: { $lt: position.id } },
      ];
    }
    const records = await models.Attendance.find(query)
      .sort({ attendanceDate: -1, _id: -1 })
      .limit(limit + 1)
      .lean();
    const hasMore = records.length > limit;
    const items = hasMore ? records.slice(0, limit) : records;
    return {
      items,
      pagination: {
        limit,
        hasMore,
        nextCursor: hasMore ? encodeCursor(items[items.length - 1]) : null,
      },
    };
  };

  const listSectionAttendance = async ({ actor, sectionId, filters }) => {
    requireObjectId(sectionId, 'sectionId');
    requireObjectId(filters.classId, 'classId');
    requireObjectId(filters.academicSessionId, 'academicSessionId');
    const context = await requireAcademicContext({ sectionId, ...filters });
    await requireTeacherAssignment(actor, context, context.day);
    return listRecords({
      sectionId: context.section._id,
      classId: context.academicClass._id,
      academicSessionId: context.session._id,
      attendanceDate: filters.attendanceDate,
    }, filters);
  };

  const listStudentAttendance = async ({ actor, studentUserId, filters }) => {
    requireObjectId(studentUserId, 'studentUserId');
    if (actor.role === 'STUDENT' && String(actor.sub) !== String(studentUserId)) {
      throw new ApiError(403, 'Students can only view their own attendance');
    }
    if (actor.role === 'PARENT') {
      const requestTime = now();
      const linked = await models.ParentStudent.exists({
        parentUserId: actor.sub,
        studentUserId,
        status: 'ACTIVE',
        validFrom: { $lte: requestTime },
        $or: [{ validTo: null }, { validTo: { $gte: requestTime } }],
      });
      if (!linked) throw new ApiError(403, 'Parent is not linked to this student');
    } else if (!['ADMIN', 'STUDENT'].includes(actor.role)) {
      throw new ApiError(403, 'This account cannot view student attendance history');
    }

    const filter = { studentUserId };
    if (filters.academicSessionId) filter.academicSessionId = filters.academicSessionId;
    if (filters.fromDate || filters.toDate) {
      filter.attendanceDate = {};
      if (filters.fromDate) filter.attendanceDate.$gte = filters.fromDate;
      if (filters.toDate) filter.attendanceDate.$lte = filters.toDate;
    }
    return listRecords(filter, filters);
  };

  const correctAttendance = async ({ actor, recordId, status, reason }) => {
    if (actor?.role !== 'ADMIN') throw new ApiError(403, 'Only an administrator can correct attendance');
    requireObjectId(recordId, 'recordId');
    const current = await models.Attendance.findById(recordId).lean();
    if (!current) throw new ApiError(404, 'Attendance record not found', { code: 'ATTENDANCE_NOT_FOUND' });
    if (current.status === status) throw new ApiError(409, 'Attendance already has this status', { code: 'ATTENDANCE_UNCHANGED' });
    const corrected = await models.Attendance.findOneAndUpdate({
      _id: recordId,
      status: current.status,
    }, {
      $set: {
        status,
        updatedBy: actor.sub,
        correctedAt: now(),
        lastCorrectionReason: reason,
      },
    }, { new: true, runValidators: true });
    if (!corrected) {
      throw new ApiError(409, 'Attendance changed while this correction was being saved', {
        code: 'ATTENDANCE_CHANGED',
      });
    }
    return corrected;
  };

  return { markSectionAttendance, listSectionAttendance, listStudentAttendance, correctAttendance };
};

module.exports = { ...createAttendanceService(), createAttendanceService };