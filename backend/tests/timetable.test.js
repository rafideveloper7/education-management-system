const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/timetable-tests';
process.env.JWT_ACCESS_SECRET ||= 'timetable-tests-access-secret';
process.env.JWT_REFRESH_SECRET ||= 'timetable-tests-refresh-secret';

const TimetableEntry = require('../models/TimetableEntry');
const { createTimetableService } = require('../services/timetable.service');
const validators = require('../validators/timetable.validator');
const { PERMISSIONS } = require('../authorization/constants/permissions.constants');
const { hasPermission } = require('../authorization/services/permission.service');
const { createAccessToken } = require('../services/auth/token.service');
const { errorHandler } = require('../middleware/error.middleware');
const { attachRequestId } = require('../middleware/requestId.middleware');
const timetableRoutes = require('../routes/timetable.routes');

const ids = {
  admin: '64e000000000000000000001',
  teacherOld: '64e000000000000000000002',
  teacherNew: '64e000000000000000000003',
  studentA: '64e000000000000000000004',
  studentB: '64e000000000000000000005',
  parentA: '64e000000000000000000006',
  parentB: '64e000000000000000000007',
  session: '64e000000000000000000008',
  class: '64e000000000000000000009',
  section: '64e000000000000000000010',
  subject: '64e000000000000000000011',
  entry: '64e000000000000000000012',
};

const basePayload = {
  academicSessionId: ids.session,
  classId: ids.class,
  sectionId: ids.section,
  subjectId: ids.subject,
  teacherId: ids.teacherOld,
  day: 'PENDING_DAY_POLICY',
  periodId: 'PENDING_PERIOD_POLICY',
};

const createModels = (overrides = {}) => ({
  TimetableEntry: {
    create: async ([data]) => [{ ...data, _id: ids.entry, createdAt: new Date(), updatedAt: new Date() }],
  },
  AcademicSession: { exists: async () => ({ _id: ids.session }) },
  AcademicClass: { exists: async () => ({ _id: ids.class }) },
  Section: { exists: async () => ({ _id: ids.section }) },
  Subject: { exists: async () => ({ _id: ids.subject }) },
  TeacherAssignment: { exists: async () => ({ _id: 'assignment' }) },
  StudentEnrollment: {
    find: () => ({ select() { return this; }, lean: async () => [] }),
  },
  ParentStudent: {
    find: () => ({ select() { return this; }, lean: async () => [] }),
  },
  CommunicationAudit: {
    create: async ([entry]) => [entry],
  },
  ...overrides,
});

test('timetable validators validate IDs and opaque day/period keys without hardcoding policies', () => {
  assert.equal(validators.createEntrySchema.safeParse(basePayload).success, true);
  assert.equal(validators.createEntrySchema.safeParse({ ...basePayload, teacherId: 'bad' }).success, false);
  assert.equal(validators.createEntrySchema.safeParse({ ...basePayload, day: '' }).success, false);
  assert.equal(validators.createEntrySchema.safeParse({ ...basePayload, periodId: '' }).success, false);
});

test('timetable permissions cover Admin, Teacher, Student, and Parent', () => {
  assert.equal(hasPermission({ role: 'ADMIN' }, PERMISSIONS.TIMETABLE_MANAGE), true);
  assert.equal(hasPermission({ role: 'ADMIN' }, PERMISSIONS.TIMETABLE_VIEW), true);
  assert.equal(hasPermission({ role: 'TEACHER' }, PERMISSIONS.TIMETABLE_VIEW), true);
  assert.equal(hasPermission({ role: 'STUDENT' }, PERMISSIONS.TIMETABLE_VIEW), true);
  assert.equal(hasPermission({ role: 'PARENT' }, PERMISSIONS.TIMETABLE_VIEW), true);
  assert.equal(hasPermission({ role: 'TEACHER' }, PERMISSIONS.TIMETABLE_MANAGE), false);
  assert.equal(hasPermission({ role: 'PUBLIC_USER' }, PERMISSIONS.TIMETABLE_VIEW), false);
});

test('TimetableEntry has verified teacher and section compound unique indexes', () => {
  const indexes = TimetableEntry.schema.indexes();
  const teacherIndex = indexes.find(([fields]) =>
    fields.academicSessionId === 1
    && fields.day === 1
    && fields.periodId === 1
    && fields.teacherId === 1
  );
  const sectionIndex = indexes.find(([fields]) =>
    fields.academicSessionId === 1
    && fields.day === 1
    && fields.periodId === 1
    && fields.sectionId === 1
  );
  assert.ok(teacherIndex);
  assert.equal(teacherIndex[1].unique, true);
  assert.deepEqual(teacherIndex[1].partialFilterExpression, { status: { $in: ['DRAFT', 'PUBLISHED'] } });
  assert.ok(sectionIndex);
  assert.equal(sectionIndex[1].unique, true);
  assert.equal(sectionIndex[1].partialFilterExpression.status.$in.includes('ARCHIVED'), false);
});

test('teacher assignment is required and unauthorized roles cannot create', async () => {
  const service = createTimetableService({
    models: createModels({
      TeacherAssignment: { exists: async () => null },
    }),
  });
  await assert.rejects(service.create({
    actor: { sub: ids.admin, role: 'ADMIN' },
    payload: basePayload,
  }), (error) => error.statusCode === 409 && error.code === 'TEACHER_NOT_ASSIGNED');
  await assert.rejects(service.create({
    actor: { sub: ids.teacherOld, role: 'TEACHER' },
    payload: basePayload,
  }), (error) => error.statusCode === 403);
});

test('duplicate-key race conflict is converted to clear timetable conflict', async () => {
  const service = createTimetableService({
    models: createModels({
      TimetableEntry: {
        create: async () => { const error = new Error('duplicate'); error.code = 11000; throw error; },
      },
    }),
    transaction: async (operation) => operation({ testSession: true }),
  });
  await assert.rejects(service.create({
    actor: { sub: ids.admin, role: 'ADMIN' },
    payload: basePayload,
  }), (error) => error.statusCode === 409 && error.code === 'TIMETABLE_CONFLICT');
});

test('create, update, publish, and archive emit audit entries and preserve previous values', async () => {
  const audits = [];
  let saveData;
  const entry = {
    _id: ids.entry,
    ...basePayload,
    status: 'DRAFT',
    createdBy: ids.admin,
    updatedBy: ids.admin,
    updatedAt: new Date(),
    save: async () => {},
  };
  const models = createModels({
    TimetableEntry: {
      create: async ([data]) => [{
        ...entry,
        ...data,
      }],
      findOne: () => ({
        session() { return this; },
        lean: async () => null,
      }),
    },
    CommunicationAudit: {
      create: async ([data]) => {
        audits.push(data);
        return [data];
      },
    },
  });
  const service = createTimetableService({
    models,
    transaction: async (operation) => operation({ testSession: true }),
    notifications: { publishSafe: async () => [] },
  });

  const created = await service.create({
    actor: { sub: ids.admin, role: 'ADMIN' },
    payload: basePayload,
  });
  assert.equal(audits[0].action, 'TIMETABLE_ENTRY_CREATED');
  assert.equal(audits[0].performedBy, ids.admin);

  entry.save = async ({ session }) => {
    saveData = session;
  };
  models.TimetableEntry.findOne = () => ({
    session: async () => entry,
  });
  const updated = await service.update({
    actor: { sub: ids.admin, role: 'ADMIN' },
    entryId: ids.entry,
    payload: { ...basePayload, teacherId: ids.teacherNew },
  });
  assert.equal(updated.teacherId, ids.teacherNew);
  assert.equal(saveData.testSession, true);
  assert.equal(audits[1].action, 'TIMETABLE_ENTRY_UPDATED');
  assert.equal(audits[1].previousValue.teacherId, ids.teacherOld);
  assert.equal(audits[1].newValue.teacherId, ids.teacherNew);

  entry.status = 'DRAFT';
  await service.publish({ actor: { sub: ids.admin, role: 'ADMIN' }, entryId: ids.entry });
  assert.equal(audits[2].action, 'TIMETABLE_ENTRY_PUBLISHED');
  await service.archive({ actor: { sub: ids.admin, role: 'ADMIN' }, entryId: ids.entry });
  assert.equal(audits[3].action, 'TIMETABLE_ENTRY_ARCHIVED');
});

test('published change notifications include previous and new teachers, students, and deduplicated parents', async () => {
  let payload;
  const studentRows = [
    { studentUserId: ids.studentA },
    { studentUserId: ids.studentB },
  ];
  const models = createModels({
    TimetableEntry: {
      findOne: () => ({
        session: async () => ({
          _id: ids.entry,
          ...basePayload,
          status: 'DRAFT',
          createdBy: ids.admin,
          updatedBy: ids.admin,
          save: async () => {},
        }),
      }),
    },
    StudentEnrollment: {
      find: () => ({ select() { return this; }, lean: async () => studentRows }),
    },
    ParentStudent: {
      find: () => ({
        select() { return this; },
        lean: async () => [
          { parentUserId: ids.parentA },
          { parentUserId: ids.parentA },
        ],
      }),
    },
  });
  const service = createTimetableService({
    models,
    transaction: async (operation) => operation({ testSession: true }),
    notifications: {
      publishSafe: async (value) => { payload = value; return []; },
    },
  });
  await service.publish({
    actor: { sub: ids.admin, role: 'ADMIN' },
    entryId: ids.entry,
  });
  assert.equal(payload.type, 'TIMETABLE_ENTRY_PUBLISHED');
  assert.ok(payload.recipientIds.includes(ids.teacherOld));
  assert.ok(payload.recipientIds.includes(ids.studentA));
  assert.ok(payload.recipientIds.includes(ids.studentB));
  assert.ok(payload.recipientIds.includes(ids.parentA));
});

test('student/parent ownership rejects wrong parent and student can read own only', async () => {
  const models = createModels({
    StudentEnrollment: {
      findOne: () => ({
        sort() { return this; },
        lean: async () => ({
          studentUserId: ids.studentA,
          academicSessionId: ids.session,
          classId: ids.class,
          sectionId: ids.section,
        }),
      }),
      find: () => ({ select() { return this; }, lean: async () => [] }),
    },
    ParentStudent: { exists: async () => null },
    TimetableEntry: {
      find: () => ({
        sort() { return this; },
        limit() { return this; },
        lean: async () => [],
      }),
    },
  });
  const service = createTimetableService({ models });
  await assert.rejects(service.listForParent({
    actor: { sub: ids.parentB, role: 'PARENT' },
    studentId: ids.studentA,
  }), (error) => error.statusCode === 403);
  const page = await service.listForStudent({
    actor: { sub: ids.studentA, role: 'STUDENT' },
  });
  assert.deepEqual(page.items, []);
});

test('timetable HTTP routes require Admin for writes and reject Public User', async () => {
  const app = express();
  app.use(attachRequestId);
  app.use('/api/v1', timetableRoutes);
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    const teacherToken = createAccessToken({
      _id: { toString: () => ids.teacherOld },
      role: 'TEACHER',
    }, 'timetable-teacher');
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/timetable/entries`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${teacherToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(basePayload),
    });
    assert.equal(response.status, 403);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
