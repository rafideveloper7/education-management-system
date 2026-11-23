const AcademicSession = require('../../models/academic/AcademicSession');
const AcademicClass = require('../../models/academic/Class');
const Section = require('../../models/academic/Section');
const Subject = require('../../models/academic/Subject');
const ClassSubject = require('../../models/academic/ClassSubject');
const ApiError = require('../../utils/ApiError');

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const encodeCursor = (record) => Buffer.from(JSON.stringify({
  version: 1,
  createdAt: new Date(record.createdAt).toISOString(),
  id: String(record._id),
})).toString('base64url');

const decodeCursor = (cursor) => {
  try {
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    const createdAt = new Date(value.createdAt);
    if (value.version !== 1 || !OBJECT_ID_PATTERN.test(value.id) || Number.isNaN(createdAt.getTime())) {
      throw new Error('Invalid cursor payload');
    }
    return { createdAt, id: value.id };
  } catch (error) {
    throw new ApiError(400, 'cursor must be a valid academic cursor', { code: 'INVALID_CURSOR' });
  }
};

const createAcademicService = ({ models = { AcademicSession, AcademicClass, Section, Subject, ClassSubject } } = {}) => {
  const requireId = (id) => {
    if (!OBJECT_ID_PATTERN.test(String(id || ''))) throw new ApiError(400, 'recordId must be a valid ObjectId');
  };
  const requireActive = async (Model, id, label) => {
    const record = await Model.exists({ _id: id, status: 'ACTIVE' });
    if (!record) throw new ApiError(404, `${label} not found or inactive`, { code: 'ACADEMIC_REFERENCE_NOT_FOUND' });
  };
  const list = async (Model, filters) => {
    const { limit = 50, cursor, ...filter } = filters;
    if (cursor) {
      const position = decodeCursor(cursor);
      filter.$or = [
        { createdAt: { $lt: position.createdAt } },
        { createdAt: position.createdAt, _id: { $lt: position.id } },
      ];
    }
    const records = await Model.find(filter)
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
  const get = async (Model, id, label) => {
    requireId(id);
    const record = await Model.findById(id).lean();
    if (!record) throw new ApiError(404, `${label} not found`, { code: 'ACADEMIC_RECORD_NOT_FOUND' });
    return record;
  };
  const create = async (Model, data) => Model.create(data);
  const update = async (Model, id, data, label) => {
    requireId(id);
    const record = await Model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!record) throw new ApiError(404, `${label} not found`, { code: 'ACADEMIC_RECORD_NOT_FOUND' });
    return record;
  };

  const createSession = async (data) => {
    if (await models.AcademicSession.exists({
      startDate: { $lte: data.endDate },
      endDate: { $gte: data.startDate },
    })) {
      throw new ApiError(409, 'Academic session dates overlap an existing session', { code: 'ACADEMIC_SESSION_OVERLAP' });
    }
    return create(models.AcademicSession, data);
  };
  const changeSessionStatus = async (id, nextStatus) => {
    const current = await get(models.AcademicSession, id, 'Academic session');
    const transitions = {
      PLANNED: ['ACTIVE', 'ARCHIVED'],
      ACTIVE: ['COMPLETED'],
      COMPLETED: ['ARCHIVED'],
      ARCHIVED: [],
    };
    if (!transitions[current.status]?.includes(nextStatus)) {
      throw new ApiError(409, `Cannot change academic session from ${current.status} to ${nextStatus}`, {
        code: 'INVALID_SESSION_TRANSITION',
      });
    }
    if (nextStatus === 'ACTIVE' && await models.AcademicSession.exists({ status: 'ACTIVE' })) {
      throw new ApiError(409, 'Another academic session is already active', { code: 'ACTIVE_SESSION_EXISTS' });
    }
    return update(models.AcademicSession, id, { status: nextStatus }, 'Academic session');
  };
  const updateSession = async (id, data) => {
    const current = await get(models.AcademicSession, id, 'Academic session');
    if (current.status !== 'PLANNED') {
      throw new ApiError(409, 'Only planned academic sessions can be edited', { code: 'SESSION_NOT_EDITABLE' });
    }
    const nextStart = data.startDate || current.startDate;
    const nextEnd = data.endDate || current.endDate;
    if (nextStart >= nextEnd) throw new ApiError(400, 'endDate must be after startDate');
    if (await models.AcademicSession.exists({
      _id: { $ne: id },
      startDate: { $lte: nextEnd },
      endDate: { $gte: nextStart },
    })) {
      throw new ApiError(409, 'Academic session dates overlap an existing session', { code: 'ACADEMIC_SESSION_OVERLAP' });
    }
    return update(models.AcademicSession, id, data, 'Academic session');
  };

  const createSection = async (data) => {
    await requireActive(models.AcademicClass, data.classId, 'Class');
    return create(models.Section, data);
  };
  const createClassSubject = async (data) => {
    await requireActive(models.AcademicClass, data.classId, 'Class');
    await requireActive(models.Subject, data.subjectId, 'Subject');
    return create(models.ClassSubject, data);
  };
  const updateSection = async (id, data) => {
    if (data.status === 'ACTIVE') {
      const section = await get(models.Section, id, 'Section');
      await requireActive(models.AcademicClass, section.classId, 'Class');
    }
    return update(models.Section, id, data, 'Section');
  };
  const updateClassSubject = async (id, data) => {
    if (data.status === 'ACTIVE') {
      const link = await get(models.ClassSubject, id, 'Class-subject link');
      await requireActive(models.AcademicClass, link.classId, 'Class');
      await requireActive(models.Subject, link.subjectId, 'Subject');
    }
    return update(models.ClassSubject, id, data, 'Class-subject link');
  };

  return {
    createSession,
    listSessions: (query) => list(models.AcademicSession, query),
    getSession: (id) => get(models.AcademicSession, id, 'Academic session'),
    updateSession,
    changeSessionStatus,
    createClass: (data) => create(models.AcademicClass, data),
    listClasses: (query) => list(models.AcademicClass, query),
    getClass: (id) => get(models.AcademicClass, id, 'Class'),
    updateClass: (id, data) => update(models.AcademicClass, id, data, 'Class'),
    createSection,
    listSections: (query) => list(models.Section, query),
    getSection: (id) => get(models.Section, id, 'Section'),
    updateSection,
    createSubject: (data) => create(models.Subject, data),
    listSubjects: (query) => list(models.Subject, query),
    getSubject: (id) => get(models.Subject, id, 'Subject'),
    updateSubject: (id, data) => update(models.Subject, id, data, 'Subject'),
    createClassSubject,
    listClassSubjects: (query) => list(models.ClassSubject, query),
    getClassSubject: (id) => get(models.ClassSubject, id, 'Class-subject link'),
    updateClassSubject,
  };
};

module.exports = { ...createAcademicService(), createAcademicService };