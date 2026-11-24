const mongoose = require('mongoose');
const TimetableEntry = require('../models/TimetableEntry');
const AcademicSession = require('../models/academic/AcademicSession');
const AcademicClass = require('../models/academic/Class');
const Section = require('../models/academic/Section');
const Subject = require('../models/academic/Subject');
const TeacherAssignment = require('../models/teacher/TeacherAssignment');
const StudentEnrollment = require('../models/student/StudentEnrollment');
const ParentStudent = require('../models/parent/ParentStudent');
const CommunicationAudit = require('../models/communication/CommunicationAudit');
const ApiError = require('../utils/ApiError');
const notificationService = require('./notification/notification.service');
const { createCommunicationAuditService, withAuditTransaction } = require('./communication/audit.service');

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const requireObjectId = (value, field) => {
  if (!OBJECT_ID_PATTERN.test(String(value || ''))) {
    throw new ApiError(400, `${field} must be a valid ObjectId`, { code: 'INVALID_OBJECT_ID' });
  }
};

const encodeCursor = (record) => Buffer.from(JSON.stringify({
  version: 1,
  createdAt: new Date(record.createdAt).toISOString(),
  id: String(record._id),
})).toString('base64url');

const decodeCursor = (cursor) => {
  try {
    const payload = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    const createdAt = new Date(payload.createdAt);
    if (payload.version !== 1 || !OBJECT_ID_PATTERN.test(payload.id)
      || Number.isNaN(createdAt.getTime())) throw new Error();
    return { createdAt, id: payload.id };
  } catch {
    throw new ApiError(400, 'cursor must be a valid timetable cursor', { code: 'INVALID_CURSOR' });
  }
};

const createTimetableService = ({
  models = {
    TimetableEntry,
    AcademicSession,
    AcademicClass,
    Section,
    Subject,
    TeacherAssignment,
    StudentEnrollment,
    ParentStudent,
    CommunicationAudit,
  },
  transaction = withAuditTransaction,
  notifications = notificationService,
} = {}) => {
  const audit = createCommunicationAuditService({ model: models.CommunicationAudit });

  const requireAdmin = (actor) => {
    if (!actor || actor.role !== 'ADMIN') {
      throw new ApiError(403, 'Only administrators can manage timetables');
    }
  };

  const snapshot = (entry) => ({
    academicSessionId: entry.academicSessionId,
    classId: entry.classId,
    sectionId: entry.sectionId,
    subjectId: entry.subjectId,
    teacherId: entry.teacherId,
    day: entry.day,
    periodId: entry.periodId,
    status: entry.status,
  });

  const validateContext = async (payload) => {
    for (const [value, field] of [
      [payload.academicSessionId, 'academicSessionId'],
      [payload.classId, 'classId'],
      [payload.sectionId, 'sectionId'],
      [payload.subjectId, 'subjectId'],
      [payload.teacherId, 'teacherId'],
    ]) requireObjectId(value, field);
    if (!payload.day || String(payload.day).trim().length === 0) {
      throw new ApiError(400, 'day is required', { code: 'TIMETABLE_DAY_REQUIRED' });
    }
    if (!payload.periodId || String(payload.periodId).trim().length === 0) {
      throw new ApiError(400, 'periodId is required', { code: 'TIMETABLE_PERIOD_REQUIRED' });
    }

    const [session, academicClass, section, subject, assigned] = await Promise.all([
      models.AcademicSession.exists({ _id: payload.academicSessionId, status: { $in: ['PLANNED', 'ACTIVE'] } }),
      models.AcademicClass.exists({ _id: payload.classId, status: 'ACTIVE' }),
      models.Section.exists({ _id: payload.sectionId, classId: payload.classId, status: 'ACTIVE' }),
      models.Subject.exists({ _id: payload.subjectId, status: 'ACTIVE' }),
      models.TeacherAssignment.exists({
        teacherUserId: payload.teacherId,
        academicSessionId: payload.academicSessionId,
        classId: payload.classId,
        sectionId: payload.sectionId,
        subjectId: payload.subjectId,
        status: 'ACTIVE',
        validFrom: { $lte: new Date() },
        $or: [{ validTo: null }, { validTo: { $gte: new Date() } }],
      }),
    ]);
    if (!session || !academicClass || !section || !subject) {
      throw new ApiError(400, 'Academic timetable context is invalid or inactive', {
        code: 'INVALID_TIMETABLE_CONTEXT',
      });
    }
    if (!assigned) {
      throw new ApiError(409, 'Teacher is not assigned to this subject, class, and section', {
        code: 'TEACHER_NOT_ASSIGNED',
      });
    }
  };

  const resolveAffectedRecipients = async (entries) => {
    const recipients = new Set();
    for (const entry of entries) {
      if (!entry) continue;
      recipients.add(String(entry.teacherId));
      const enrollments = await models.StudentEnrollment.find({
        academicSessionId: entry.academicSessionId,
        classId: entry.classId,
        sectionId: entry.sectionId,
        status: 'ACTIVE',
      }).select('studentUserId').lean();
      const studentIds = enrollments.map((item) => String(item.studentUserId));
      for (const studentId of studentIds) recipients.add(studentId);
      if (studentIds.length > 0) {
        const links = await models.ParentStudent.find({
          studentUserId: { $in: studentIds },
          status: 'ACTIVE',
          validFrom: { $lte: new Date() },
          $or: [{ validTo: null }, { validTo: { $gte: new Date() } }],
        }).select('parentUserId').lean();
        for (const link of links) recipients.add(String(link.parentUserId));
      }
    }
    return [...recipients];
  };

  const notifyChange = async ({ type, entry, previousEntry = null, action }) => {
    const recipientIds = await resolveAffectedRecipients([previousEntry, entry]);
    if (recipientIds.length === 0) return;
    await notifications.publishSafe({
      eventId: `timetable-${action}:${entry._id}:${action === 'UPDATED' ? new Date(entry.updatedAt).toISOString() : String(entry._id)}`,
      type,
      title: action === 'ARCHIVED' ? 'Timetable Entry Archived' : 'Timetable Changed',
      message: action === 'ARCHIVED'
        ? 'An affected timetable entry has been archived.'
        : 'An affected timetable entry has been published or updated.',
      recipientIds,
      referenceId: entry._id,
      referenceType: 'TIMETABLE_ENTRY',
      actorId: entry.updatedBy || entry.createdBy,
    });
  };

  const normalizeConflictError = (error) => {
    if (error?.code === 11000) {
      throw new ApiError(409, 'Timetable slot is already assigned to a teacher or section', {
        code: 'TIMETABLE_CONFLICT',
      });
    }
  };

  const create = async ({ actor, payload }) => {
    requireAdmin(actor);
    await validateContext(payload);
    try {
      return await transaction(async (session) => {
        const created = await models.TimetableEntry.create([{
          ...payload,
          day: String(payload.day).trim(),
          periodId: String(payload.periodId).trim(),
          status: 'DRAFT',
          publishedAt: null,
          archivedAt: null,
          createdBy: actor.sub,
          updatedBy: actor.sub,
        }], { session });
        const entry = Array.isArray(created) ? created[0] : created;
        await audit.record({
          session,
          entityType: 'TIMETABLE',
          entityId: entry._id,
          action: 'TIMETABLE_ENTRY_CREATED',
          performedBy: actor.sub,
          newValue: snapshot(entry),
        });
        return entry;
      });
    } catch (error) {
      normalizeConflictError(error);
      throw error;
    }
  };

  const update = async ({ actor, entryId, payload }) => {
    requireAdmin(actor);
    requireObjectId(entryId, 'entryId');
    await validateContext(payload);
    try {
      const result = await transaction(async (session) => {
        const current = await models.TimetableEntry.findOne({
          _id: entryId,
          status: { $in: ['DRAFT', 'PUBLISHED'] },
        }).session(session);
        if (!current) throw new ApiError(404, 'Timetable entry not found');
        const previous = snapshot(current);
        current.academicSessionId = payload.academicSessionId;
        current.classId = payload.classId;
        current.sectionId = payload.sectionId;
        current.subjectId = payload.subjectId;
        current.teacherId = payload.teacherId;
        current.day = String(payload.day).trim();
        current.periodId = String(payload.periodId).trim();
        current.updatedBy = actor.sub;
        await current.save({ session });
        await audit.record({
          session,
          entityType: 'TIMETABLE',
          entityId: current._id,
          action: 'TIMETABLE_ENTRY_UPDATED',
          performedBy: actor.sub,
          previousValue: previous,
          newValue: snapshot(current),
        });
        return { entry: current, previous };
      });
      if (result.previous.status === 'PUBLISHED' || result.entry.status === 'PUBLISHED') {
        await notifyChange({
          type: 'TIMETABLE_ENTRY_UPDATED',
          entry: result.entry,
          previousEntry: result.previous,
          action: 'UPDATED',
        });
      }
      return result.entry;
    } catch (error) {
      normalizeConflictError(error);
      throw error;
    }
  };

  const publish = async ({ actor, entryId }) => {
    requireAdmin(actor);
    requireObjectId(entryId, 'entryId');
    const published = await transaction(async (session) => {
      const current = await models.TimetableEntry.findOne({
        _id: entryId,
        status: 'DRAFT',
      }).session(session);
      if (!current) throw new ApiError(404, 'Draft timetable entry not found');
      const previous = snapshot(current);
      current.status = 'PUBLISHED';
      current.publishedAt = new Date();
      current.updatedBy = actor.sub;
      await current.save({ session });
      await audit.record({
        session,
        entityType: 'TIMETABLE',
        entityId: current._id,
        action: 'TIMETABLE_ENTRY_PUBLISHED',
        performedBy: actor.sub,
        previousValue: previous,
        newValue: snapshot(current),
      });
      return current;
    });
    await notifyChange({
      type: 'TIMETABLE_ENTRY_PUBLISHED',
      entry: published,
      action: 'PUBLISHED',
    });
    return published;
  };

  const archive = async ({ actor, entryId }) => {
    requireAdmin(actor);
    requireObjectId(entryId, 'entryId');
    const archived = await transaction(async (session) => {
      const current = await models.TimetableEntry.findOne({
        _id: entryId,
        status: { $in: ['DRAFT', 'PUBLISHED'] },
      }).session(session);
      if (!current) throw new ApiError(404, 'Active timetable entry not found');
      const previous = snapshot(current);
      current.status = 'ARCHIVED';
      current.archivedAt = new Date();
      current.updatedBy = actor.sub;
      await current.save({ session });
      await audit.record({
        session,
        entityType: 'TIMETABLE',
        entityId: current._id,
        action: 'TIMETABLE_ENTRY_ARCHIVED',
        performedBy: actor.sub,
        previousValue: previous,
        newValue: snapshot(current),
      });
      return current;
    });
    await notifyChange({
      type: 'TIMETABLE_ENTRY_ARCHIVED',
      entry: archived,
      action: 'ARCHIVED',
    });
    return archived;
  };

  const listPage = async (query, filters = {}) => {
    if (filters.cursor) {
      const position = decodeCursor(filters.cursor);
      query.$or = [
        { createdAt: { $lt: position.createdAt } },
        { createdAt: position.createdAt, _id: { $lt: position.id } },
      ];
    }
    const limit = filters.limit || 50;
    const records = await models.TimetableEntry.find(query)
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

  const listForAdmin = async ({ filters = {} }) => listPage({}, filters);

  const listForClass = async ({ actor, classId, sectionId, filters = {} }) => {
    requireAdmin(actor);
    requireObjectId(classId, 'classId');
    requireObjectId(sectionId, 'sectionId');
    return listPage({ classId, sectionId }, filters);
  };

  const listForTeacher = async ({ actor, filters = {} }) => {
    if (!actor?.sub) throw new ApiError(401, 'Authentication required');
    return listPage({ teacherId: actor.sub, status: 'PUBLISHED' }, filters);
  };

  const listForStudent = async ({ actor, filters = {} }) => {
    if (!actor?.sub) throw new ApiError(401, 'Authentication required');
    const enrollment = await models.StudentEnrollment.findOne({
      studentUserId: actor.sub,
      status: 'ACTIVE',
    }).sort({ validFrom: -1 }).lean();
    if (!enrollment) return { items: [], pagination: { limit: filters.limit || 50, hasMore: false, nextCursor: null } };
    return listPage({
      academicSessionId: enrollment.academicSessionId,
      classId: enrollment.classId,
      sectionId: enrollment.sectionId,
      status: 'PUBLISHED',
    }, filters);
  };

  const listForParent = async ({ actor, studentId, filters = {} }) => {
    requireObjectId(studentId, 'studentId');
    const linked = await models.ParentStudent.exists({
      parentUserId: actor.sub,
      studentUserId: studentId,
      status: 'ACTIVE',
      validFrom: { $lte: new Date() },
      $or: [{ validTo: null }, { validTo: { $gte: new Date() } }],
    });
    if (!linked) throw new ApiError(403, 'Parent is not linked to this student');
    const enrollment = await models.StudentEnrollment.findOne({
      studentUserId: studentId,
      status: 'ACTIVE',
    }).sort({ validFrom: -1 }).lean();
    if (!enrollment) throw new ApiError(404, 'Student enrollment not found');
    return listPage({
      academicSessionId: enrollment.academicSessionId,
      classId: enrollment.classId,
      sectionId: enrollment.sectionId,
      status: 'PUBLISHED',
    }, filters);
  };

  return {
    create,
    update,
    publish,
    archive,
    listForAdmin,
    listForClass,
    listForTeacher,
    listForStudent,
    listForParent,
  };
};

module.exports = { createTimetableService };
