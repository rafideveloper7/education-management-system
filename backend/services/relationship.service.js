const ParentStudent = require('../models/parent/ParentStudent');
const StudentEnrollment = require('../models/student/StudentEnrollment');
const TeacherAssignment = require('../models/teacher/TeacherAssignment');
const User = require('../models/user/User');
const ApiError = require('../utils/ApiError');
const { createRelationshipLifecycleService } = require('../authorization/services/relationship-lifecycle.service');

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const encodeCursor = (record) => Buffer.from(JSON.stringify({
  version: 1,
  validFrom: new Date(record.validFrom).toISOString(),
  id: String(record._id),
})).toString('base64url');

const decodeCursor = (cursor) => {
  try {
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    const validFrom = new Date(value.validFrom);

    if (
      value.version !== 1
      || !OBJECT_ID_PATTERN.test(value.id)
      || Number.isNaN(validFrom.getTime())
    ) {
      throw new Error('Invalid cursor payload');
    }

    return { validFrom, id: value.id };
  } catch (error) {
    throw new ApiError(400, 'cursor must be a valid relationship cursor');
  }
};

const createRelationshipService = ({
  models = { ParentStudent, StudentEnrollment, TeacherAssignment, User },
  lifecycle = createRelationshipLifecycleService({
    ParentStudent: models.ParentStudent,
    StudentEnrollment: models.StudentEnrollment,
    TeacherAssignment: models.TeacherAssignment,
  }),
} = {}) => {
  const requireObjectId = (value, field) => {
    if (typeof value !== 'string' || !OBJECT_ID_PATTERN.test(value)) {
      throw new ApiError(400, `${field} must be a valid ObjectId`);
    }
  };

  const requireActiveUser = async (userId, role, field) => {
    requireObjectId(userId, field);
    const user = await models.User.exists({ _id: userId, role, status: 'ACTIVE' });
    if (!user) {
      throw new ApiError(404, `${field} does not identify an active ${role.toLowerCase()} account`);
    }
  };

  const createUniqueActiveRecord = async (Model, duplicateFilter, data) => {
    if (await Model.exists(duplicateFilter)) {
      throw new ApiError(409, 'An active relationship with these details already exists', {
        code: 'RELATIONSHIP_ALREADY_EXISTS',
      });
    }

    try {
      return await Model.create(data);
    } catch (error) {
      if (error.code === 11000) {
        throw new ApiError(409, 'An active relationship with these details already exists', {
          code: 'RELATIONSHIP_ALREADY_EXISTS',
        });
      }
      throw error;
    }
  };

  const listRecords = async (Model, filters) => {
    const { limit = 50, cursor, ...query } = filters;

    if (cursor) {
      const position = decodeCursor(cursor);
      query.$or = [
        { validFrom: { $lt: position.validFrom } },
        { validFrom: position.validFrom, _id: { $lt: position.id } },
      ];
    }

    const records = await Model.find(query)
      .sort({ validFrom: -1, _id: -1 })
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

  const getRecord = async (Model, id) => {
    requireObjectId(id, 'relationshipId');
    return Model.findById(id).lean();
  };

  const closeRecord = async (close, id, status, effectiveAt) => {
    requireObjectId(id, 'relationshipId');

    try {
      const record = await close(id, status, effectiveAt);
      if (!record) throw new ApiError(404, 'Active relationship not found');
      return record;
    } catch (error) {
      if (error instanceof TypeError) throw new ApiError(400, error.message);
      throw error;
    }
  };

  const createParentStudent = async (payload) => {
    if (payload.parentUserId === payload.studentUserId) {
      throw new ApiError(400, 'A user cannot be their own parent or guardian');
    }

    await requireActiveUser(payload.parentUserId, 'PARENT', 'parentUserId');
    await requireActiveUser(payload.studentUserId, 'STUDENT', 'studentUserId');

    const data = {
      parentUserId: payload.parentUserId,
      studentUserId: payload.studentUserId,
      relationshipType: payload.relationshipType,
      validFrom: payload.validFrom,
      notes: payload.notes,
      status: 'ACTIVE',
    };

    return createUniqueActiveRecord(models.ParentStudent, {
      parentUserId: data.parentUserId,
      studentUserId: data.studentUserId,
      relationshipType: data.relationshipType,
      status: 'ACTIVE',
    }, data);
  };

  const createStudentEnrollment = async (payload) => {
    await requireActiveUser(payload.studentUserId, 'STUDENT', 'studentUserId');
    for (const field of ['academicSessionId', 'classId', 'sectionId']) {
      requireObjectId(payload[field], field);
    }

    const data = {
      studentUserId: payload.studentUserId,
      academicSessionId: payload.academicSessionId,
      classId: payload.classId,
      sectionId: payload.sectionId,
      rollNumber: payload.rollNumber,
      validFrom: payload.validFrom,
      status: 'ACTIVE',
    };

    return createUniqueActiveRecord(models.StudentEnrollment, {
      studentUserId: data.studentUserId,
      academicSessionId: data.academicSessionId,
      status: 'ACTIVE',
    }, data);
  };

  const createTeacherAssignment = async (payload) => {
    await requireActiveUser(payload.teacherUserId, 'TEACHER', 'teacherUserId');
    for (const field of ['academicSessionId', 'subjectId', 'classId', 'sectionId']) {
      requireObjectId(payload[field], field);
    }

    const data = {
      teacherUserId: payload.teacherUserId,
      academicSessionId: payload.academicSessionId,
      subjectId: payload.subjectId,
      classId: payload.classId,
      sectionId: payload.sectionId,
      validFrom: payload.validFrom,
      status: 'ACTIVE',
    };

    return createUniqueActiveRecord(models.TeacherAssignment, {
      ...data,
      status: 'ACTIVE',
    }, data);
  };

  const closeParentStudent = (id, status = 'ENDED', at) => closeRecord(
    lifecycle.closeParentStudent,
    id,
    status,
    at
  );
  const closeStudentEnrollment = (id, status = 'ENDED', at) => closeRecord(
    lifecycle.closeStudentEnrollment,
    id,
    status,
    at
  );
  const closeTeacherAssignment = (id, status = 'ENDED', at) => closeRecord(
    lifecycle.closeTeacherAssignment,
    id,
    status,
    at
  );

  return {
    createParentStudent,
    listParentStudents: (filters) => listRecords(models.ParentStudent, filters),
    getParentStudent: (id) => getRecord(models.ParentStudent, id),
    closeParentStudent,
    createStudentEnrollment,
    listStudentEnrollments: (filters) => listRecords(models.StudentEnrollment, filters),
    getStudentEnrollment: (id) => getRecord(models.StudentEnrollment, id),
    closeStudentEnrollment,
    createTeacherAssignment,
    listTeacherAssignments: (filters) => listRecords(models.TeacherAssignment, filters),
    getTeacherAssignment: (id) => getRecord(models.TeacherAssignment, id),
    closeTeacherAssignment,
  };
};

const relationshipService = createRelationshipService();

module.exports = { ...relationshipService, createRelationshipService };