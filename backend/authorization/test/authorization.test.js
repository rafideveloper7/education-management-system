const test = require('node:test');
const assert = require('node:assert/strict');

process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/authorization-tests';
process.env.JWT_ACCESS_SECRET ||= 'authorization-integration-test-access-secret';
process.env.JWT_REFRESH_SECRET ||= 'authorization-integration-test-refresh-secret';

const express = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { createAccessToken } = require('../../services/auth/token.service');
const { errorHandler } = require('../../middleware/error.middleware');
const { attachRequestId } = require('../../middleware/requestId.middleware');

const {
  ROLES,
  PERMISSIONS,
  hasPermission,
  hasAllPermissions,
  canAccessStudentRecord,
  canEnterResult,
  requirePermissions,
  requireResourceAccess,
  createRelationshipContextResolver,
  createRelationshipLifecycleService,
} = require('../index');
const ParentStudent = require('../../models/parent/ParentStudent');
const StudentEnrollment = require('../../models/student/StudentEnrollment');
const TeacherAssignment = require('../../models/teacher/TeacherAssignment');

const createResponse = () => ({
  statusCode: null,
  body: null,
  status(statusCode) {
    this.statusCode = statusCode;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test('permission grants are role-based and deny unknown roles', () => {
  assert.equal(hasPermission({ role: ROLES.TEACHER }, PERMISSIONS.ATTENDANCE_MARK), true);
  assert.equal(hasPermission({ role: ROLES.STUDENT }, PERMISSIONS.ATTENDANCE_MARK), false);
  assert.equal(hasPermission({ role: 'UNKNOWN' }, PERMISSIONS.STUDENT_VIEW), false);
  assert.equal(hasPermission({ role: 'toString' }, PERMISSIONS.STUDENT_VIEW), false);
  assert.equal(hasAllPermissions({ role: ROLES.TEACHER }, [
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ATTENDANCE_MARK,
  ]), true);
});

test('student and parent access is restricted to their own linked records', () => {
  assert.equal(canAccessStudentRecord({
    user: { sub: 'student-1', role: ROLES.STUDENT },
    studentUserId: 'student-1',
    relationship: { isStudentEnrolled: true },
  }), true);
  assert.equal(canAccessStudentRecord({
    user: { sub: 'student-1', role: ROLES.STUDENT },
    studentUserId: 'student-1',
    relationship: { isStudentEnrolled: false },
  }), false);
  assert.equal(canAccessStudentRecord({
    user: { sub: 'parent-1', role: ROLES.PARENT },
    studentUserId: 'student-2',
    relationship: { isLinkedParent: true, isStudentEnrolled: true },
  }), true);
  assert.equal(canAccessStudentRecord({
    user: { sub: 'parent-1', role: ROLES.PARENT },
    studentUserId: 'student-3',
    relationship: { isLinkedParent: false, isStudentEnrolled: true },
  }), false);
});

test('teacher access requires assigned class and subject and an unpublished result', () => {
  const context = {
    user: { sub: 'teacher-1', role: ROLES.TEACHER },
    result: {
      academicSessionId: 'session-1',
      classId: 'class-10a',
      sectionId: 'section-a',
      subjectId: 'math',
      status: 'DRAFT',
    },
    relationship: { hasTeachingAssignment: true, isStudentEnrolled: true },
  };

  assert.equal(canEnterResult(context), true);
  assert.equal(canEnterResult({
    ...context,
    relationship: { hasTeachingAssignment: false, isStudentEnrolled: true },
  }), false);
  assert.equal(canEnterResult({
    ...context,
    result: { ...context.result, status: 'PUBLISHED' },
  }), false);
});

test('relationship resolver scopes student enrollment to resource session and effective date', async () => {
  const userId = '64b000000000000000000001';
  const sessionId = '64b000000000000000000002';
  const classId = '64b000000000000000000003';
  const sectionId = '64b000000000000000000004';
  const queryLog = [];
  const models = {
    ParentStudent: { exists: async (query) => { queryLog.push(query); return null; } },
    StudentEnrollment: { exists: async (query) => { queryLog.push(query); return { _id: 'enrollment' }; } },
    TeacherAssignment: { exists: async (query) => { queryLog.push(query); return null; } },
  };
  const date = new Date('2026-09-01T00:00:00Z');
  const resolveContext = createRelationshipContextResolver({
    resolveResource: async () => ({
      studentUserId: userId,
      academicSessionId: sessionId,
      classId,
      sectionId,
      occurredAt: date,
    }),
    models,
    now: () => date,
  });

  const context = await resolveContext({ user: { sub: userId, role: ROLES.STUDENT } });

  assert.equal(context.relationship.isStudentEnrolled, true);
  assert.equal(queryLog[0].studentUserId, userId);
  assert.equal(queryLog[0].academicSessionId, sessionId);
  assert.equal(queryLog[0].classId, classId);
  assert.equal(queryLog[0].sectionId, sectionId);
  assert.deepEqual(queryLog[0].validFrom, { $lte: date });
  assert.deepEqual(queryLog[0].$or[1], {
    status: { $in: ['COMPLETED', 'ENDED'] },
    validTo: { $gte: date },
  });
  assert.equal(canAccessStudentRecord({
    user: { sub: userId, role: ROLES.STUDENT },
    ...context,
  }), true);
});

test('relationship resolver only grants parents active links and teachers session assignments', async () => {
  const parentId = '64b000000000000000000011';
  const teacherId = '64b000000000000000000012';
  const studentId = '64b000000000000000000013';
  const sessionId = '64b000000000000000000014';
  const classId = '64b000000000000000000015';
  const sectionId = '64b000000000000000000016';
  const subjectId = '64b000000000000000000017';
  const parentQueries = [];
  const assignmentQueries = [];
  const date = new Date('2026-09-01T00:00:00Z');
  const models = {
    ParentStudent: { exists: async (query) => { parentQueries.push(query); return true; } },
    StudentEnrollment: { exists: async () => ({ _id: 'enrollment' }) },
    TeacherAssignment: { exists: async (query) => { assignmentQueries.push(query); return true; } },
  };
  const resource = {
    studentUserId: studentId,
    academicSessionId: sessionId,
    classId,
    sectionId,
    subjectId,
    occurredAt: date,
  };
  const resolveContext = createRelationshipContextResolver({
    resolveResource: async () => resource,
    models,
    now: () => date,
  });

  const parentContext = await resolveContext({ user: { sub: parentId, role: ROLES.PARENT } });
  const teacherContext = await resolveContext({ user: { sub: teacherId, role: ROLES.TEACHER } });

  assert.equal(parentContext.relationship.isLinkedParent, true);
  assert.equal(parentContext.relationship.isStudentEnrolled, true);
  assert.equal(parentQueries[0].parentUserId, parentId);
  assert.equal(parentQueries[0].studentUserId, studentId);
  assert.equal(parentQueries[0].status, 'ACTIVE');
  assert.equal(teacherContext.relationship.hasTeachingAssignment, true);
  assert.equal(assignmentQueries[0].teacherUserId, teacherId);
  assert.equal(assignmentQueries[0].academicSessionId, sessionId);
  assert.equal(assignmentQueries[0].subjectId, subjectId);
  assert.deepEqual(assignmentQueries[0].$or[1], {
    status: { $in: ['ENDED'] },
    validTo: { $gte: date },
  });
});

test('relationship lifecycle closes records without deleting history', async () => {
  const calls = [];
  const fakeModel = {
    findOneAndUpdate: async (...args) => {
      calls.push(args);
      return { _id: args[0]._id, ...args[1].$set };
    },
  };
  const endedAt = new Date('2027-01-15T00:00:00Z');
  const lifecycle = createRelationshipLifecycleService({
    ParentStudent: fakeModel,
    StudentEnrollment: fakeModel,
    TeacherAssignment: fakeModel,
    now: () => endedAt,
  });

  const closed = await lifecycle.closeParentStudent('relationship-1', 'DECEASED');

  assert.equal(closed.status, 'DECEASED');
  assert.deepEqual(calls[0][0], {
    _id: 'relationship-1',
    status: 'ACTIVE',
    validFrom: { $lte: endedAt },
  });
  assert.deepEqual(calls[0][1], { $set: { status: 'DECEASED', validTo: endedAt } });
  await assert.rejects(
    lifecycle.closeParentStudent('relationship-1', 'ACTIVE'),
    /Unsupported relationship status/
  );
});

test('relationship schemas validate identity, type, and effective-date bounds', async () => {
  const userId = '64b000000000000000000021';
  const relation = new ParentStudent({
    parentUserId: userId,
    studentUserId: '64b000000000000000000022',
    relationshipType: 'GUARDIAN',
    validFrom: new Date('2026-01-01T00:00:00Z'),
    validTo: new Date('2025-12-31T00:00:00Z'),
  });
  const enrollment = new StudentEnrollment({
    studentUserId: userId,
    academicSessionId: '64b000000000000000000023',
    classId: '64b000000000000000000024',
    sectionId: '64b000000000000000000025',
  });
  const assignment = new TeacherAssignment({
    teacherUserId: userId,
    academicSessionId: '64b000000000000000000023',
    subjectId: '64b000000000000000000026',
    classId: '64b000000000000000000024',
    sectionId: '64b000000000000000000025',
  });

  await assert.rejects(relation.validate(), /validTo must be on or after validFrom/);
  await Promise.all([enrollment.validate(), assignment.validate()]);
});

test('permission middleware rejects missing authentication and denied actions', () => {
  const middleware = requirePermissions(PERMISSIONS.ATTENDANCE_MARK);
  const unauthenticatedResponse = createResponse();
  let unauthenticatedError;
  middleware({ user: null }, unauthenticatedResponse, (error) => { unauthenticatedError = error; });
  assert.equal(unauthenticatedError.statusCode, 401);

  const deniedResponse = createResponse();
  let deniedError;
  middleware(
    { user: { role: ROLES.STUDENT } },
    deniedResponse,
    (error) => { deniedError = error; }
  );
  assert.equal(deniedError.statusCode, 403);
});

test('resource middleware keeps authenticated user authoritative', async () => {
  const middleware = requireResourceAccess({
    resolveContext: async () => ({ user: { role: ROLES.ADMIN }, resourceId: 'record-1' }),
    policy: ({ user }) => user.role === ROLES.STUDENT,
  });
  const req = { user: { sub: 'student-1', role: ROLES.STUDENT } };
  let nextCalled = false;

  await middleware(req, createResponse(), () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.equal(req.authorization.resourceId, 'record-1');
});

test('HTTP authorization flow verifies JWT, permission, enrollment, parent link, and teacher assignment', async () => {
  const ids = {
    student: '64b000000000000000000031',
    otherStudent: '64b000000000000000000032',
    parent: '64b000000000000000000033',
    teacher: '64b000000000000000000034',
    session: '64b000000000000000000035',
    otherSession: '64b000000000000000000036',
    class: '64b000000000000000000037',
    section: '64b000000000000000000038',
    subject: '64b000000000000000000039',
    otherSubject: '64b000000000000000000040',
  };
  const accessDate = new Date('2026-09-01T00:00:00.000Z');
  const resources = {
    own: {
      studentUserId: ids.student,
      academicSessionId: ids.session,
      classId: ids.class,
      sectionId: ids.section,
      subjectId: ids.subject,
      occurredAt: accessDate,
    },
    other: {
      studentUserId: ids.otherStudent,
      academicSessionId: ids.session,
      classId: ids.class,
      sectionId: ids.section,
      subjectId: ids.subject,
      occurredAt: accessDate,
    },
    noEnrollment: {
      studentUserId: ids.student,
      academicSessionId: ids.otherSession,
      classId: ids.class,
      sectionId: ids.section,
      subjectId: ids.subject,
      occurredAt: accessDate,
    },
    teacherOtherSubject: {
      studentUserId: ids.student,
      academicSessionId: ids.session,
      classId: ids.class,
      sectionId: ids.section,
      subjectId: ids.otherSubject,
      occurredAt: accessDate,
    },
  };
  const enrolledScopes = [
    [ids.student, ids.session],
    [ids.otherStudent, ids.session],
  ];
  const models = {
    StudentEnrollment: {
      exists: async (query) => enrolledScopes.some(([studentUserId, academicSessionId]) => (
        query.studentUserId === studentUserId
        && query.academicSessionId === academicSessionId
        && query.classId === ids.class
        && query.sectionId === ids.section
      )),
    },
    ParentStudent: {
      exists: async (query) => query.parentUserId === ids.parent
        && query.studentUserId === ids.student
        && query.status === 'ACTIVE',
    },
    TeacherAssignment: {
      exists: async (query) => query.teacherUserId === ids.teacher
        && query.academicSessionId === ids.session
        && query.classId === ids.class
        && query.sectionId === ids.section
        && query.subjectId === ids.subject,
    },
  };
  const resolveContext = createRelationshipContextResolver({
    resolveResource: async (req) => resources[req.params.resourceId] || null,
    models,
    now: () => accessDate,
  });
  const app = express();
  app.use(attachRequestId);
  const authenticateAndAuthorize = [
    authenticate,
    requirePermissions(PERMISSIONS.ATTENDANCE_VIEW),
    requireResourceAccess({ resolveContext, policy: canAccessStudentRecord }),
  ];

  app.get('/resources/:resourceId', ...authenticateAndAuthorize, (req, res) => {
    res.status(200).json({ success: true, resourceId: req.authorization.resource.studentUserId });
  });
  app.post(
    '/attendance/mark',
    authenticate,
    requirePermissions(PERMISSIONS.ATTENDANCE_MARK),
    (req, res) => res.sendStatus(204)
  );
  app.use(errorHandler);

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const tokenFor = (userId, role) => createAccessToken(
    { _id: { toString: () => userId }, role },
    'authorization-test-session'
  );
  const request = (path, token, method = 'GET') => fetch(`${baseUrl}${path}`, {
    method,
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });

  try {
    const ownerToken = tokenFor(ids.student, ROLES.STUDENT);
    const parentToken = tokenFor(ids.parent, ROLES.PARENT);
    const teacherToken = tokenFor(ids.teacher, ROLES.TEACHER);

    assert.equal((await request('/resources/own', ownerToken)).status, 200);
    assert.equal((await request('/resources/other', ownerToken)).status, 403);
    assert.equal((await request('/resources/noEnrollment', ownerToken)).status, 403);
    assert.equal((await request('/resources/own', parentToken)).status, 200);
    assert.equal((await request('/resources/other', parentToken)).status, 403);
    assert.equal((await request('/resources/own', teacherToken)).status, 200);
    assert.equal((await request('/resources/teacherOtherSubject', teacherToken)).status, 403);
    assert.equal((await request('/resources/own', 'invalid.jwt.token')).status, 401);
    assert.equal((await request('/resources/own')).status, 401);
    assert.equal((await request('/attendance/mark', ownerToken, 'POST')).status, 403);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});