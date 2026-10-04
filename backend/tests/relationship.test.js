const test = require('node:test');
const assert = require('node:assert/strict');

process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/relationship-tests';
process.env.JWT_ACCESS_SECRET ||= 'relationship-tests-access-secret';
process.env.JWT_REFRESH_SECRET ||= 'relationship-tests-refresh-secret';

const express = require('express');
const { createRelationshipService } = require('../services/relationship.service');
const { ROLES } = require('../authorization/constants/roles.constants');
const { PERMISSIONS } = require('../authorization/constants/permissions.constants');
const { hasPermission } = require('../authorization/services/permission.service');
const { createAccessToken } = require('../services/auth/token.service');
const relationshipRoutes = require('../routes/admin/relationships.routes');
const { errorHandler } = require('../middleware/error.middleware');
const { attachRequestId } = require('../middleware/requestId.middleware');
const {
  parseParentStudentCreate,
  parseParentStudentListQuery,
  parseStudentEnrollmentCreate,
  parseStudentEnrollmentListQuery,
  parseTeacherAssignmentCreate,
  parseTeacherAssignmentListQuery,
} = require('../validators/relationships/relationship.validator');

const ids = {
  parent: '64b000000000000000000001',
  student: '64b000000000000000000002',
  teacher: '64b000000000000000000003',
  session: '64b000000000000000000004',
  otherSession: '64b000000000000000000005',
  class: '64b000000000000000000006',
  section: '64b000000000000000000007',
  subject: '64b000000000000000000008',
  secondSubject: '64b000000000000000000009',
};

const matches = (record, filter) => Object.entries(filter).every(([key, value]) => record[key] === value);

const createModel = () => {
  const records = [];
  let nextId = 1;

  return {
    records,
    exists: async (filter) => records.some((record) => matches(record, filter)),
    create: async (data) => {
      const record = { _id: (nextId++).toString(16).padStart(24, '0'), ...data };
      records.push(record);
      return record;
    },
    find: (filter) => ({
      sort() { return this; },
      limit(value) { this.limitValue = value; return this; },
      lean: async function lean() {
        return records.filter((record) => matches(record, Object.fromEntries(
          Object.entries(filter).filter(([, value]) => value !== undefined)
        ))).slice(0, this.limitValue);
      },
    }),
    findById: (id) => ({ lean: async () => records.find((record) => record._id === id) || null }),
  };
};

const createTestService = () => {
  const models = {
    User: {
      exists: async ({ _id, role, status }) => (
        ({ [ids.parent]: ROLES.PARENT, [ids.student]: ROLES.STUDENT, [ids.teacher]: ROLES.TEACHER })[_id] === role
        && status === 'ACTIVE'
      ),
    },
    ParentStudent: createModel(),
    StudentEnrollment: createModel(),
    TeacherAssignment: createModel(),
  };
  const closeCalls = [];
  const lifecycle = {
    closeParentStudent: async (...args) => { closeCalls.push(['parent', ...args]); return { _id: args[0], status: args[1] }; },
    closeStudentEnrollment: async (...args) => { closeCalls.push(['enrollment', ...args]); return { _id: args[0], status: args[1] }; },
    closeTeacherAssignment: async (...args) => { closeCalls.push(['assignment', ...args]); return { _id: args[0], status: args[1] }; },
  };

  return { service: createRelationshipService({ models, lifecycle }), models, closeCalls };
};

test('relationship creation validates account roles and rejects duplicate active links', async () => {
  const { service, models } = createTestService();
  const input = parseParentStudentCreate({
    parentUserId: ids.parent,
    studentUserId: ids.student,
    relationshipType: 'GUARDIAN',
  });

  const created = await service.createParentStudent(input);
  assert.equal(created.status, 'ACTIVE');
  assert.equal(models.ParentStudent.records.length, 1);

  await assert.rejects(service.createParentStudent(input), { statusCode: 409 });
  await assert.rejects(service.createParentStudent({
    ...input,
    parentUserId: ids.teacher,
  }), { statusCode: 404 });
  await assert.rejects(service.createParentStudent({
    ...input,
    studentUserId: ids.parent,
  }), { statusCode: 400 });
});

test('enrollment allows session history but prevents two active placements in one session', async () => {
  const { service, models } = createTestService();
  const base = {
    studentUserId: ids.student,
    academicSessionId: ids.session,
    classId: ids.class,
    sectionId: ids.section,
  };

  const current = await service.createStudentEnrollment(parseStudentEnrollmentCreate(base));
  assert.equal(current.status, 'ACTIVE');
  await assert.rejects(service.createStudentEnrollment(parseStudentEnrollmentCreate({
    ...base,
    classId: ids.otherSession,
  })), { statusCode: 409 });

  const nextSession = await service.createStudentEnrollment(parseStudentEnrollmentCreate({
    ...base,
    academicSessionId: ids.otherSession,
  }));
  assert.equal(nextSession.status, 'ACTIVE');
  assert.equal(models.StudentEnrollment.records.length, 2);
});

test('teacher can hold multiple assignments while exact active duplicates are rejected', async () => {
  const { service, models } = createTestService();
  const first = parseTeacherAssignmentCreate({
    teacherUserId: ids.teacher,
    academicSessionId: ids.session,
    subjectId: ids.subject,
    classId: ids.class,
    sectionId: ids.section,
  });

  await service.createTeacherAssignment(first);
  await assert.rejects(service.createTeacherAssignment(first), { statusCode: 409 });
  const second = await service.createTeacherAssignment(parseTeacherAssignmentCreate({
    ...first,
    subjectId: ids.secondSubject,
  }));

  assert.equal(second.status, 'ACTIVE');
  assert.equal(models.TeacherAssignment.records.length, 2);
});

test('relationship reads expose history and closing delegates to lifecycle without deleting', async () => {
  const { service, models, closeCalls } = createTestService();
  const created = await service.createParentStudent(parseParentStudentCreate({
    parentUserId: ids.parent,
    studentUserId: ids.student,
    relationshipType: 'FATHER',
  }));

  assert.equal((await service.getParentStudent(created._id))._id, created._id);
  assert.equal((await service.listParentStudents({ studentUserId: ids.student, limit: 10 })).items.length, 1);
  const closed = await service.closeParentStudent(created._id, 'DECEASED');

  assert.equal(closed.status, 'DECEASED');
  assert.equal(models.ParentStudent.records.length, 1);
  assert.deepEqual(closeCalls[0], ['parent', created._id, 'DECEASED', undefined]);
});

test('relationship list APIs paginate with stable opaque cursors', async () => {
  const validFrom = new Date('2026-01-01T00:00:00.000Z');
  const records = ['1', '2', '3'].map((suffix) => ({
    _id: `64b00000000000000000000${suffix}`,
    studentUserId: ids.student,
    validFrom,
  }));
  const queries = [];
  const ParentStudent = {
    find(query) {
      queries.push(query);
      let pageLimit;

      return {
        sort(sortOrder) {
          assert.deepEqual(sortOrder, { validFrom: -1, _id: -1 });
          return this;
        },
        limit(value) {
          pageLimit = value;
          return this;
        },
        lean: async () => {
          const matching = records.filter((record) => {
            if (record.studentUserId !== query.studentUserId) return false;
            if (!query.$or) return true;

            return (
              record.validFrom < query.$or[0].validFrom.$lt
              || (
                record.validFrom.getTime() === query.$or[1].validFrom.getTime()
                && record._id < query.$or[1]._id.$lt
              )
            );
          });

          matching.sort((left, right) => right._id.localeCompare(left._id));
          return matching.slice(0, pageLimit);
        },
      };
    },
  };
  const service = createRelationshipService({
    models: {
      ParentStudent,
      StudentEnrollment: createModel(),
      TeacherAssignment: createModel(),
      User: { exists: async () => null },
    },
  });

  const firstPage = await service.listParentStudents(parseParentStudentListQuery({
    studentUserId: ids.student,
    limit: 2,
  }));
  const secondPage = await service.listParentStudents(parseParentStudentListQuery({
    studentUserId: ids.student,
    limit: 2,
    cursor: firstPage.pagination.nextCursor,
  }));

  assert.deepEqual(firstPage.items.map((record) => record._id), [records[2]._id, records[1]._id]);
  assert.equal(firstPage.pagination.hasMore, true);
  assert.equal(typeof firstPage.pagination.nextCursor, 'string');
  assert.deepEqual(secondPage.items.map((record) => record._id), [records[0]._id]);
  assert.equal(secondPage.pagination.hasMore, false);
  assert.equal(secondPage.pagination.nextCursor, null);
  assert.deepEqual(queries[1].$or, [
    { validFrom: { $lt: validFrom } },
    { validFrom, _id: { $lt: records[1]._id } },
  ]);
});

test('relationship list queries accept only filters for their resource', () => {
  assert.throws(() => parseParentStudentListQuery({ teacherUserId: ids.teacher }), { statusCode: 400 });
  assert.throws(() => parseStudentEnrollmentListQuery({ relationshipType: 'FATHER' }), { statusCode: 400 });
  assert.throws(() => parseTeacherAssignmentListQuery({ status: 'DECEASED' }), { statusCode: 400 });
});

test('relationship APIs require admin-specific permissions', () => {
  assert.equal(hasPermission({ role: ROLES.ADMIN }, PERMISSIONS.PARENT_STUDENT_MANAGE), true);
  assert.equal(hasPermission({ role: ROLES.ADMIN }, PERMISSIONS.STUDENT_ENROLLMENT_MANAGE), true);
  assert.equal(hasPermission({ role: ROLES.ADMIN }, PERMISSIONS.TEACHER_ASSIGNMENT_MANAGE), true);
  assert.equal(hasPermission({ role: ROLES.TEACHER }, PERMISSIONS.PARENT_STUDENT_MANAGE), false);
  assert.equal(hasPermission({ role: ROLES.PARENT }, PERMISSIONS.STUDENT_ENROLLMENT_MANAGE), false);
});

test('relationship request schemas reject invalid identifiers and client-owned lifecycle fields', () => {
  assert.throws(() => parseStudentEnrollmentCreate({
    studentUserId: 'invalid',
    academicSessionId: ids.session,
    classId: ids.class,
    sectionId: ids.section,
  }), { statusCode: 400 });
  assert.throws(() => parseParentStudentCreate({
    parentUserId: ids.parent,
    studentUserId: ids.student,
    relationshipType: 'GUARDIAN',
    status: 'ENDED',
  }), { statusCode: 400 });
});

test('parent-student schema rejects a self relationship', async () => {
  const ParentStudent = require('../models/parent/ParentStudent');
  const selfRelationship = new ParentStudent({
    parentUserId: ids.parent,
    studentUserId: ids.parent,
    relationshipType: 'GUARDIAN',
  });

  await assert.rejects(selfRelationship.validate(), /own parent or guardian/);
});

test('relationship HTTP routes reject unauthenticated and non-admin callers', async () => {
  const app = express();
  app.use(attachRequestId);
  app.use('/api/v1/admin/relationships', relationshipRoutes);
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));

  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1/admin/relationships`;
  const studentToken = createAccessToken({
    _id: { toString: () => ids.student },
    role: ROLES.STUDENT,
  }, 'relationship-test-session');

  try {
    for (const collection of ['parent-students', 'student-enrollments', 'teacher-assignments']) {
      const unauthenticated = await fetch(`${baseUrl}/${collection}`);
      assert.equal(unauthenticated.status, 401);
      assert.equal((await unauthenticated.json()).error.code, 'UNAUTHENTICATED');

      const forbidden = await fetch(`${baseUrl}/${collection}`, {
        headers: { authorization: `Bearer ${studentToken}` },
      });
      assert.equal(forbidden.status, 403);
      assert.equal((await forbidden.json()).error.code, 'FORBIDDEN');
    }
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
