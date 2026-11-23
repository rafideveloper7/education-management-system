const Exam = require('../../models/examination/Exam');
const ExamSchedule = require('../../models/examination/ExamSchedule');
const ExamAudit = require('../../models/examination/ExamAudit');
const AcademicSession = require('../../models/academic/AcademicSession');
const AcademicClass = require('../../models/academic/Class');
const Section = require('../../models/academic/Section');
const Subject = require('../../models/academic/Subject');
const ClassSubject = require('../../models/academic/ClassSubject');
const StudentEnrollment = require('../../models/student/StudentEnrollment');
const TeacherAssignment = require('../../models/teacher/TeacherAssignment');
const Mark = require('../../models/examination/Mark');
const ApiError = require('../../utils/ApiError');
const { PERMISSIONS } = require('../../authorization/constants/permissions.constants');
const {
  requireObjectId,
  assertPermission,
  encodeCursor,
  decodeCursor,
  runInTransaction,
  acquireWriteLock,
  hasDateCoverage,
  occursWithinDateRange,
} = require('./examination.helpers');

const createExamService = ({
  models = {
    Exam,
    ExamSchedule,
    ExamAudit,
    AcademicSession,
    AcademicClass,
    Section,
    Subject,
    ClassSubject,
    StudentEnrollment,
    TeacherAssignment,
    Mark,
  },
  transaction = runInTransaction,
} = {}) => {
  const getExam = async (examId, session) => {
    requireObjectId(examId, 'examId');
    let query = models.Exam.findById(examId);
    if (session) query = query.session(session);
    const exam = await query.lean();
    if (!exam) throw new ApiError(404, 'Examination not found', { code: 'EXAM_NOT_FOUND' });
    return exam;
  };

  const getSchedule = async (scheduleId, session) => {
    requireObjectId(scheduleId, 'scheduleId');
    let query = models.ExamSchedule.findById(scheduleId);
    if (session) query = query.session(session);
    const schedule = await query.lean();
    if (!schedule) throw new ApiError(404, 'Examination schedule not found', { code: 'EXAM_SCHEDULE_NOT_FOUND' });
    return schedule;
  };

  const lockExamWorkflow = async (examId, session) => acquireWriteLock({
    Model: models.Exam,
    filter: { _id: examId },
    field: 'workflowRevision',
    session,
    message: 'Examination not found',
    code: 'EXAM_NOT_FOUND',
  });

  const assertScheduleAccess = async (actor, schedule) => {
    if (!actor?.sub) throw new ApiError(401, 'Authentication required');
    if (actor.role === 'ADMIN') {
      assertPermission(actor, PERMISSIONS.RESULT_VIEW);
      return;
    }
    if (actor.role !== 'TEACHER') {
      throw new ApiError(403, 'Only an administrator or assigned teacher can access this schedule');
    }
    assertPermission(actor, PERMISSIONS.RESULT_VIEW);
    if (schedule.teacherUserId && String(schedule.teacherUserId) !== String(actor.sub)) {
      throw new ApiError(403, 'Teacher is not assigned to this examination schedule');
    }
    const assigned = await models.TeacherAssignment.exists({
      teacherUserId: actor.sub,
      academicSessionId: schedule.academicSessionId,
      classId: schedule.classId,
      sectionId: schedule.sectionId,
      subjectId: schedule.subjectId,
      status: { $in: ['ACTIVE', 'ENDED'] },
      validFrom: { $lte: schedule.endAt },
      $or: [{ validTo: null }, { validTo: { $gte: schedule.startAt } }],
    });
    if (!assigned) throw new ApiError(403, 'Teacher is not assigned to this examination schedule');
  };

  const list = async (Model, filter, limit, cursor) => {
    const query = { ...filter };
    if (cursor) {
      const position = decodeCursor(cursor);
      query.$or = [
        { createdAt: { $lt: position.createdAt } },
        { createdAt: position.createdAt, _id: { $lt: position.id } },
      ];
    }
    const records = await Model.find(query)
      .sort({ createdAt: -1, _id: -1 })
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

  const requireExamAccess = async (actor, examId) => {
    if (!actor?.sub) throw new ApiError(401, 'Authentication required');
    const exam = await getExam(examId);
    if (actor.role === 'ADMIN') {
      assertPermission(actor, PERMISSIONS.RESULT_VIEW);
      return exam;
    }
    if (actor.role !== 'TEACHER') {
      throw new ApiError(403, 'Only an administrator or assigned teacher can access this examination');
    }
    assertPermission(actor, PERMISSIONS.RESULT_VIEW);
    const schedules = await models.ExamSchedule.find({ examId: exam._id }).lean();
    for (const schedule of schedules) {
      try {
        await assertScheduleAccess(actor, schedule);
        return exam;
      } catch (error) {
        if (!(error instanceof ApiError) || error.statusCode !== 403) throw error;
      }
    }
    throw new ApiError(403, 'Teacher is not assigned to this examination');
  };

  const validateExamReferences = async (payload, transactionSession) => {
    let query = models.AcademicSession.findById(payload.academicSessionId);
    if (transactionSession) query = query.session(transactionSession);
    const academicSession = await query.lean();
    if (!academicSession || !['PLANNED', 'ACTIVE'].includes(academicSession.status)) {
      throw new ApiError(400, 'Examination requires a planned or active academic session', {
        code: 'INVALID_ACADEMIC_SESSION',
      });
    }
    if (!occursWithinDateRange(
      academicSession.startDate,
      academicSession.endDate,
      payload.startDate,
      payload.endDate,
    )) {
      throw new ApiError(400, 'Examination dates must fall within the academic session', {
        code: 'EXAM_DATES_OUTSIDE_SESSION',
      });
    }
    return academicSession;
  };

  const createExam = async ({ actor, payload }) => {
    requireObjectId(actor?.sub, 'authenticated user');
    assertPermission(actor, PERMISSIONS.ACADEMIC_MANAGE);
    await validateExamReferences(payload);
    return transaction(async (session) => {
      const [exam] = await models.Exam.create([{
        ...payload,
        createdBy: actor.sub,
        status: 'DRAFT',
      }], { session });
      await models.ExamAudit.create([{
        resourceType: 'EXAM',
        resourceId: exam._id,
        examId: exam._id,
        actorUserId: actor.sub,
        action: 'EXAM_CREATED',
        nextValue: { name: exam.name, examType: exam.examType, academicSessionId: exam.academicSessionId },
      }], { session });
      return exam;
    });
  };

  const listExams = async ({ actor, filters }) => {
    requireObjectId(actor?.sub, 'authenticated user');
    assertPermission(actor, actor.role === 'TEACHER'
      ? PERMISSIONS.RESULT_VIEW
      : PERMISSIONS.ACADEMIC_MANAGE);
    const query = {};
    if (filters.academicSessionId) query.academicSessionId = filters.academicSessionId;
    if (filters.status) query.status = filters.status;
    if (actor.role === 'TEACHER') {
      const assignments = await models.TeacherAssignment.find({
        teacherUserId: actor.sub,
        status: { $in: ['ACTIVE', 'ENDED'] },
      }).lean();
      const contexts = assignments.map((assignment) => ({
        academicSessionId: assignment.academicSessionId,
        classId: assignment.classId,
        sectionId: assignment.sectionId,
        subjectId: assignment.subjectId,
      }));
      const scheduleFilters = [{ teacherUserId: actor.sub }, ...contexts];
      const schedules = await models.ExamSchedule.find({ $or: scheduleFilters }).lean();
      const examIds = [];
      for (const schedule of schedules) {
        try {
          await assertScheduleAccess(actor, schedule);
          examIds.push(schedule.examId);
        } catch (error) {
          if (!(error instanceof ApiError) || error.statusCode !== 403) throw error;
        }
      }
      query._id = { $in: [...new Set(examIds.map(String))] };
    } else if (actor.role !== 'ADMIN') {
      throw new ApiError(403, 'Only authorized staff can list managed examinations');
    }
    return list(models.Exam, query, filters.limit, filters.cursor);
  };

  const getExamForActor = async ({ actor, examId }) => {
    const exam = await requireExamAccess(actor, examId);
    return exam;
  };

  const updateExam = async ({ actor, examId, payload }) => {
    requireObjectId(actor?.sub, 'authenticated user');
    assertPermission(actor, PERMISSIONS.ACADEMIC_MANAGE);
    const initial = await getExam(examId);
    return transaction(async (session) => {
      await acquireSchedulingLock(initial.academicSessionId, session);
      const current = await getExam(examId, session);
      if (current.status !== 'DRAFT') {
        throw new ApiError(409, 'Only draft examinations can be edited', { code: 'EXAM_NOT_EDITABLE' });
      }
      const nextValues = { ...current, ...payload };
      await validateExamReferences(nextValues, session);
      let schedulesQuery = models.ExamSchedule.find({ examId: current._id });
      if (session) schedulesQuery = schedulesQuery.session(session);
      const schedules = await schedulesQuery.lean();
      if (schedules.some((schedule) => !occursWithinDateRange(
        nextValues.startDate,
        nextValues.endDate,
        schedule.startAt,
        schedule.endAt,
      ))) {
        throw new ApiError(409, 'Examination dates cannot exclude an existing schedule', {
          code: 'EXAM_SCHEDULE_OUTSIDE_EXAM',
        });
      }
      const exam = await models.Exam.findOneAndUpdate(
        { _id: current._id, status: 'DRAFT' },
        { $set: payload },
        { new: true, runValidators: true, session },
      );
      if (!exam) throw new ApiError(409, 'Examination changed while it was being updated', {
        code: 'EXAM_UPDATE_CONFLICT',
      });
      await models.ExamAudit.create([{
        resourceType: 'EXAM',
        resourceId: exam._id,
        examId: exam._id,
        actorUserId: actor.sub,
        action: 'EXAM_UPDATED',
        previousValue: { name: current.name, examType: current.examType, startDate: current.startDate, endDate: current.endDate },
        nextValue: { name: exam.name, examType: exam.examType, startDate: exam.startDate, endDate: exam.endDate },
      }], { session });
      return exam;
    });
  };

  const validEnrollmentsForSchedule = async (schedule, session) => {
    let query = models.StudentEnrollment.find({
      academicSessionId: schedule.academicSessionId,
      classId: schedule.classId,
      sectionId: schedule.sectionId,
      status: { $in: ['ACTIVE', 'COMPLETED', 'ENDED'] },
      validFrom: { $lte: schedule.endAt },
    });
    if (session) query = query.session(session);
    const enrollments = await query.lean();
    return enrollments.filter((enrollment) => hasDateCoverage(enrollment, schedule.startAt, schedule.endAt));
  };

  const assertScheduleCompleteness = async (exam, session) => {
    let schedulesQuery = models.ExamSchedule.find({ examId: exam._id });
    if (session) schedulesQuery = schedulesQuery.session(session);
    const schedules = await schedulesQuery.lean();
    if (schedules.length === 0) {
      throw new ApiError(409, 'At least one examination schedule is required', {
        code: 'EXAM_SCHEDULE_REQUIRED',
      });
    }
    for (const schedule of schedules) {
      const enrollments = await validEnrollmentsForSchedule(schedule, session);
      const studentIds = enrollments.map(({ studentUserId }) => String(studentUserId));
      if (new Set(studentIds).size !== studentIds.length) {
        throw new ApiError(409, 'Student has multiple eligible enrollments for this examination schedule', {
          code: 'AMBIGUOUS_STUDENT_ENROLLMENT',
        });
      }
      let marksQuery = models.Mark.find({ examScheduleId: schedule._id }).select('studentUserId');
      if (session) marksQuery = marksQuery.session(session);
      const marks = await marksQuery.lean();
      const recordedStudents = new Set(marks.map(({ studentUserId }) => String(studentUserId)));
      const missingMarks = enrollments.filter(({ studentUserId }) => !recordedStudents.has(String(studentUserId)));
      if (missingMarks.length) {
        throw new ApiError(409, 'Every eligible student must have marks or an explicit absent status', {
          code: 'EXAM_MARKS_INCOMPLETE',
          details: [{ field: 'examScheduleId', message: `${missingMarks.length} eligible student mark record(s) are missing` }],
        });
      }
    }
  };

  const changeExamStatus = async ({ actor, examId, status }) => {
    requireObjectId(actor?.sub, 'authenticated user');
    assertPermission(actor, PERMISSIONS.ACADEMIC_MANAGE);
    const initial = await getExam(examId);
    const transitions = {
      DRAFT: ['SCHEDULED'],
      SCHEDULED: ['IN_PROGRESS'],
      IN_PROGRESS: ['COMPLETED'],
      COMPLETED: ['RESULTS_READY'],
      RESULTS_READY: [],
    };
    return transaction(async (session) => {
      await acquireSchedulingLock(initial.academicSessionId, session);
      const current = await getExam(examId, session);
      if (!transitions[current.status].includes(status)) {
        throw new ApiError(409, `Cannot change examination from ${current.status} to ${status}`, {
          code: 'INVALID_EXAM_TRANSITION',
        });
      }
      if (status === 'SCHEDULED') {
        let schedulesQuery = models.ExamSchedule.exists({ examId: current._id });
        if (session) schedulesQuery = schedulesQuery.session(session);
        const hasSchedule = await schedulesQuery;
        if (!hasSchedule) throw new ApiError(409, 'At least one schedule is required before scheduling an examination', {
          code: 'EXAM_SCHEDULE_REQUIRED',
        });
      }
      if (status === 'RESULTS_READY') await assertScheduleCompleteness(current, session);
      const exam = await models.Exam.findOneAndUpdate(
        { _id: current._id, status: current.status },
        { $set: { status }, $inc: { workflowRevision: 1 } },
        { new: true, runValidators: true, session },
      );
      if (!exam) throw new ApiError(409, 'Examination status changed concurrently', {
        code: 'EXAM_STATUS_CONFLICT',
      });
      await models.ExamAudit.create([{
        resourceType: 'EXAM',
        resourceId: exam._id,
        examId: exam._id,
        actorUserId: actor.sub,
        action: 'EXAM_STATUS_CHANGED',
        previousValue: { status: current.status },
        nextValue: { status },
      }], { session });
      return exam;
    });
  };

  const acquireSchedulingLock = async (academicSessionId, session) => {
    await acquireWriteLock({
      Model: models.AcademicSession,
      filter: { _id: academicSessionId },
      field: 'examScheduleRevision',
      session,
      message: 'Academic session not found',
      code: 'ACADEMIC_SESSION_NOT_FOUND',
    });
  };

  const validateSchedule = async ({ exam, payload, scheduleId, session }) => {
    if (!occursWithinDateRange(exam.startDate, exam.endDate, payload.startAt, payload.endAt)) {
      throw new ApiError(400, 'Schedule times must fall within the examination dates', {
        code: 'SCHEDULE_OUTSIDE_EXAM',
      });
    }
    const sessionQuery = models.AcademicSession.findById(exam.academicSessionId);
    const classQuery = models.AcademicClass.findById(payload.classId);
    const sectionQuery = models.Section.findById(payload.sectionId);
    const subjectQuery = models.Subject.findById(payload.subjectId);
    const classSubjectQuery = models.ClassSubject.findOne({
        classId: payload.classId,
        subjectId: payload.subjectId,
        status: 'ACTIVE',
      });
    const queries = [sessionQuery, classQuery, sectionQuery, subjectQuery, classSubjectQuery]
      .map((query) => (session ? query.session(session) : query).lean());
    const [academicSession, academicClass, section, subject, classSubject] = await Promise.all(queries);
    if (!academicSession || !['PLANNED', 'ACTIVE'].includes(academicSession.status)
      || !academicClass || academicClass.status !== 'ACTIVE'
      || !section || section.status !== 'ACTIVE'
      || String(section.classId) !== String(payload.classId)
      || !subject || subject.status !== 'ACTIVE'
      || !classSubject) {
      throw new ApiError(400, 'Schedule references must identify an active, matching academic context', {
        code: 'INVALID_SCHEDULE_ACADEMIC_CONTEXT',
      });
    }
    if (!occursWithinDateRange(academicSession.startDate, academicSession.endDate, payload.startAt, payload.endAt)) {
      throw new ApiError(400, 'Schedule times must fall within the academic session', {
        code: 'SCHEDULE_OUTSIDE_SESSION',
      });
    }
    if (payload.teacherUserId) {
      let assignmentQuery = models.TeacherAssignment.exists({
        teacherUserId: payload.teacherUserId,
        academicSessionId: exam.academicSessionId,
        classId: payload.classId,
        sectionId: payload.sectionId,
        subjectId: payload.subjectId,
        status: { $in: ['ACTIVE', 'ENDED'] },
        validFrom: { $lte: payload.endAt },
        $or: [{ validTo: null }, { validTo: { $gte: payload.startAt } }],
      });
      if (session) assignmentQuery = assignmentQuery.session(session);
      const assigned = await assignmentQuery;
      if (!assigned) throw new ApiError(400, 'Teacher must be assigned to the scheduled subject and section', {
        code: 'TEACHER_ASSIGNMENT_REQUIRED',
      });
    }

    const excludeCurrent = scheduleId ? { _id: { $ne: scheduleId } } : {};
    const conflicts = [
      models.ExamSchedule.exists({
        ...excludeCurrent,
        sectionId: payload.sectionId,
        startAt: { $lt: payload.endAt },
        endAt: { $gt: payload.startAt },
      }),
    ];
    if (payload.teacherUserId) {
      conflicts.push(models.ExamSchedule.exists({
        ...excludeCurrent,
        teacherUserId: payload.teacherUserId,
        startAt: { $lt: payload.endAt },
        endAt: { $gt: payload.startAt },
      }));
    }
    if (payload.room) {
      conflicts.push(models.ExamSchedule.exists({
        ...excludeCurrent,
        room: payload.room.trim().toUpperCase(),
        startAt: { $lt: payload.endAt },
        endAt: { $gt: payload.startAt },
      }));
    }
    if (session) {
      for (let index = 0; index < conflicts.length; index += 1) {
        conflicts[index] = conflicts[index].session(session);
      }
    }
    if ((await Promise.all(conflicts)).some(Boolean)) {
      throw new ApiError(409, 'Schedule conflicts with an existing section, teacher, or room booking', {
        code: 'EXAM_SCHEDULE_CONFLICT',
      });
    }
  };

  const createSchedule = async ({ actor, examId, payload }) => {
    requireObjectId(actor?.sub, 'authenticated user');
    assertPermission(actor, PERMISSIONS.ACADEMIC_MANAGE);
    const initial = await getExam(examId);
    return transaction(async (session) => {
      await acquireSchedulingLock(initial.academicSessionId, session);
      const exam = await getExam(examId, session);
      if (exam.status !== 'DRAFT') throw new ApiError(409, 'Schedules can only be added to draft examinations', {
        code: 'EXAM_NOT_EDITABLE',
      });
      await validateSchedule({ exam, payload, session });
      const [schedule] = await models.ExamSchedule.create([{
        ...payload,
        academicSessionId: exam.academicSessionId,
        examId: exam._id,
        createdBy: actor.sub,
      }], { session });
      await models.ExamAudit.create([{
        resourceType: 'SCHEDULE',
        resourceId: schedule._id,
        examId: exam._id,
        actorUserId: actor.sub,
        action: 'SCHEDULE_CREATED',
        nextValue: {
          sectionId: schedule.sectionId,
          subjectId: schedule.subjectId,
          startAt: schedule.startAt,
          endAt: schedule.endAt,
        },
      }], { session });
      return schedule;
    });
  };

  const listSchedules = async ({ actor, examId, filters }) => {
    const exam = await requireExamAccess(actor, examId);
    const query = { examId: exam._id };
    let teacherContextFilter = null;
    if (actor.role === 'TEACHER') {
      const assignments = await models.TeacherAssignment.find({
        teacherUserId: actor.sub,
        academicSessionId: exam.academicSessionId,
        status: { $in: ['ACTIVE', 'ENDED'] },
      }).lean();
      teacherContextFilter = { $or: [
        { teacherUserId: actor.sub },
        ...assignments.map((assignment) => ({
          academicSessionId: assignment.academicSessionId,
          classId: assignment.classId,
          sectionId: assignment.sectionId,
          subjectId: assignment.subjectId,
        })),
      ] };
    }
    if (filters.cursor) {
      const position = decodeCursor(filters.cursor);
      const cursorFilter = { $or: [
        { createdAt: { $lt: position.createdAt } },
        { createdAt: position.createdAt, _id: { $lt: position.id } },
      ] };
      query.$and = teacherContextFilter ? [teacherContextFilter, cursorFilter] : [cursorFilter];
    } else if (teacherContextFilter) {
      query.$or = teacherContextFilter.$or;
    }
    const schedules = await models.ExamSchedule.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(filters.limit + 1)
      .lean();
    const authorizedSchedules = [];
    if (actor.role === 'TEACHER') {
      for (const schedule of schedules) {
        try {
          await assertScheduleAccess(actor, schedule);
          authorizedSchedules.push(schedule);
        } catch (error) {
          if (!(error instanceof ApiError) || error.statusCode !== 403) throw error;
        }
      }
    } else {
      authorizedSchedules.push(...schedules);
    }
    const hasMore = authorizedSchedules.length > filters.limit;
    const items = hasMore ? authorizedSchedules.slice(0, filters.limit) : authorizedSchedules;
    return {
      items,
      pagination: {
        limit: filters.limit,
        hasMore,
        nextCursor: hasMore ? encodeCursor(items[items.length - 1]) : null,
      },
    };
  };

  const updateSchedule = async ({ actor, scheduleId, payload }) => {
    requireObjectId(actor?.sub, 'authenticated user');
    assertPermission(actor, PERMISSIONS.ACADEMIC_MANAGE);
    const initialSchedule = await getSchedule(scheduleId);
    return transaction(async (session) => {
      await acquireSchedulingLock(initialSchedule.academicSessionId, session);
      const current = await getSchedule(scheduleId, session);
      const exam = await getExam(current.examId, session);
      if (exam.status !== 'DRAFT') throw new ApiError(409, 'Schedules can only be changed while the examination is a draft', {
        code: 'EXAM_NOT_EDITABLE',
      });
      const updatedValues = { ...current, ...payload };
      await validateSchedule({
        exam,
        payload: updatedValues,
        scheduleId: current._id,
        session,
      });
      const schedule = await models.ExamSchedule.findOneAndUpdate(
        { _id: current._id, updatedAt: current.updatedAt },
        { $set: payload },
        { new: true, runValidators: true, session },
      );
      if (!schedule) throw new ApiError(404, 'Examination schedule not found', { code: 'EXAM_SCHEDULE_NOT_FOUND' });
      await models.ExamAudit.create([{
        resourceType: 'SCHEDULE',
        resourceId: schedule._id,
        examId: exam._id,
        actorUserId: actor.sub,
        action: 'SCHEDULE_UPDATED',
        previousValue: {
          startAt: current.startAt,
          endAt: current.endAt,
          teacherUserId: current.teacherUserId,
          room: current.room,
          maximumMarks: current.maximumMarks,
        },
        nextValue: {
          startAt: schedule.startAt,
          endAt: schedule.endAt,
          teacherUserId: schedule.teacherUserId,
          room: schedule.room,
          maximumMarks: schedule.maximumMarks,
        },
      }], { session });
      return schedule;
    });
  };

  const listEligibleStudents = async ({ actor, scheduleId }) => {
    const schedule = await getSchedule(scheduleId);
    await assertScheduleAccess(actor, schedule);
    const enrollments = await validEnrollmentsForSchedule(schedule);
    return enrollments.map((enrollment) => ({
      enrollmentId: enrollment._id,
      studentUserId: enrollment.studentUserId,
      rollNumber: enrollment.rollNumber || null,
    }));
  };

  const listTeacherExams = async ({ actor, filters }) => {
    if (actor?.role !== 'TEACHER') throw new ApiError(403, 'Teacher access is required');
    return listExams({ actor, filters });
  };

  const listTeacherExamSchedules = async ({ actor, examId, filters }) => (
    listSchedules({ actor, examId, filters })
  );

  return {
    getExam,
    getSchedule,
    lockExamWorkflow,
    requireExamAccess,
    assertScheduleAccess,
    validEnrollmentsForSchedule,
    createExam,
    listExams,
    getExamForActor,
    updateExam,
    changeExamStatus,
    createSchedule,
    listSchedules,
    updateSchedule,
    listEligibleStudents,
    listTeacherExams,
    listTeacherExamSchedules,
  };
};

module.exports = { ...createExamService(), createExamService };
