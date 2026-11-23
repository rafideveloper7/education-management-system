const test = require('node:test');
const assert = require('node:assert/strict');

process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/academic-tests';
process.env.JWT_ACCESS_SECRET ||= 'academic-tests-access-secret';
process.env.JWT_REFRESH_SECRET ||= 'academic-tests-refresh-secret';

const express = require('express');
const { createAcademicService } = require('../services/academic/academic.service');
const { PERMISSIONS } = require('../authorization/constants/permissions.constants');
const { hasPermission } = require('../authorization/services/permission.service');
const { createAccessToken } = require('../services/auth/token.service');
const academicRoutes = require('../routes/admin/academic.routes');
const { errorHandler } = require('../middleware/error.middleware');
const { attachRequestId } = require('../middleware/requestId.middleware');
const validators = require('../validators/academic/academic.validator');

const ids = {
  session: '64b000000000000000000001',
  class: '64b000000000000000000002',
  section: '64b000000000000000000003',
  subject: '64b000000000000000000004',
};

const matches = (record, filter) => Object.entries(filter).every(([key, expected]) => {
  if (expected && typeof expected === 'object' && '$lte' in expected) {
    return record[key] <= expected.$lte;
  }
  if (expected && typeof expected === 'object' && '$gte' in expected) {
    return record[key] >= expected.$gte;
  }
  if (expected && typeof expected === 'object' && '$ne' in expected) return record[key] !== expected.$ne;
  return String(record[key]) === String(expected);
});

const createModel = (seed = []) => {
  const records = seed.map((record) => ({ ...record }));
  return {
    records,
    exists: async (filter) => records.some((record) => matches(record, filter)),
    create: async (data) => {
      const record = { _id: `${records.length + 1}`.padStart(24, '0'), ...data };
      records.push(record);
      return record;
    },
    find: (filter) => ({
      sort() { return this; },
      limit(value) { this.max = value; return this; },
      lean: async function lean() { return records.filter((record) => matches(record, filter)).slice(0, this.max); },
    }),
    findById: (id) => ({ lean: async () => records.find((record) => String(record._id) === String(id)) || null }),
    findByIdAndUpdate: async (id, data) => {
      const record = records.find((entry) => String(entry._id) === String(id));
      if (!record) return null;
      Object.assign(record, data);
      return record;
    },
  };
};

const createTestModels = () => ({
  AcademicSession: createModel([
    { _id: ids.session, sessionName: '2026-2027', startDate: new Date('2026-08-01'), endDate: new Date('2027-06-30'), status: 'PLANNED' },
  ]),
  AcademicClass: createModel([{ _id: ids.class, className: 'Class 9', status: 'ACTIVE' }]),
  Section: createModel([{ _id: ids.section, classId: ids.class, sectionName: 'A', status: 'ACTIVE' }]),
  Subject: createModel([{ _id: ids.subject, subjectName: 'Mathematics', subjectCode: 'MATH-09', status: 'ACTIVE' }]),
  ClassSubject: createModel(),
});

test('Group 10 request validators reject invalid dates, identifiers, and unknown fields', () => {
  assert.equal(validators.sessionCreateSchema.safeParse({
    sessionName: '2026-2027', startDate: '2027-01-01', endDate: '2026-01-01',
  }).success, false);
  assert.equal(validators.sectionCreateSchema.safeParse({ classId: 'bad', sectionName: 'A' }).success, false);
  assert.equal(validators.subjectCreateSchema.safeParse({ subjectName: 'Math', subjectCode: 'MATH', role: 'ADMIN' }).success, false);
});

test('academic service prevents overlapping sessions and invalid status transitions', async () => {
  const models = createTestModels();
  const service = createAcademicService({ models });
  await assert.rejects(service.createSession({
    sessionName: 'Overlapping', startDate: new Date('2026-09-01'), endDate: new Date('2027-08-01'),
  }), { statusCode: 409, code: 'ACADEMIC_SESSION_OVERLAP' });
  await assert.rejects(service.changeSessionStatus(ids.session, 'COMPLETED'), {
    statusCode: 409,
    code: 'INVALID_SESSION_TRANSITION',
  });
  const activated = await service.changeSessionStatus(ids.session, 'ACTIVE');
  assert.equal(activated.status, 'ACTIVE');
});

test('academic service enforces the single active session rule', async () => {
  const models = createTestModels();
  models.AcademicSession.records.push({
    _id: '64b000000000000000000010',
    sessionName: '2027-2028',
    status: 'ACTIVE',
  });
  const service = createAcademicService({ models });

  await assert.rejects(service.changeSessionStatus(ids.session, 'ACTIVE'), {
    statusCode: 409,
    code: 'ACTIVE_SESSION_EXISTS',
  });
});

test('academic service requires active parent resources and preserves unique links through the database model', async () => {
  const models = createTestModels();
  const service = createAcademicService({ models });
  const section = await service.createSection({ classId: ids.class, sectionName: 'B' });
  assert.equal(section.sectionName, 'B');
  const link = await service.createClassSubject({ classId: ids.class, subjectId: ids.subject, isElective: false });
  assert.equal(link.classId, ids.class);
  await assert.rejects(service.createClassSubject({
    classId: '64b000000000000000000099', subjectId: ids.subject,
  }), { statusCode: 404, code: 'ACADEMIC_REFERENCE_NOT_FOUND' });
});

test('academic lists use bounded stable cursors and reject malformed cursors', async () => {
  const records = [1, 2, 3].map((number) => ({
    _id: `64b00000000000000000000${number}`,
    subjectName: `Subject ${number}`,
    createdAt: new Date(`2026-09-0${number}T00:00:00.000Z`),
  }));
  const queries = [];
  const Subject = {
    find(query) {
      queries.push(query);
      return {
        sort(order) { assert.deepEqual(order, { createdAt: -1, _id: -1 }); return this; },
        limit(value) { assert.equal(value, 3); return this; },
        lean: async () => queries.length === 1 ? records : [records[0]],
      };
    },
  };
  const models = { ...createTestModels(), Subject };
  const service = createAcademicService({ models });
  const firstPage = await service.listSubjects({ limit: 2 });
  const secondPage = await service.listSubjects({ limit: 2, cursor: firstPage.pagination.nextCursor });

  assert.deepEqual(firstPage.items, records.slice(0, 2));
  assert.equal(firstPage.pagination.hasMore, true);
  assert.deepEqual(secondPage.items, [records[0]]);
  assert.equal(secondPage.pagination.hasMore, false);
  assert.deepEqual(queries[1].$or, [
    { createdAt: { $lt: records[1].createdAt } },
    { createdAt: records[1].createdAt, _id: { $lt: records[1]._id } },
  ]);
  await assert.rejects(service.listSubjects({ limit: 10, cursor: 'not-a-cursor' }), {
    statusCode: 400,
    code: 'INVALID_CURSOR',
  });
});

test('academic management permission is admin-only', () => {
  assert.equal(hasPermission({ role: 'ADMIN' }, PERMISSIONS.ACADEMIC_MANAGE), true);
  assert.equal(hasPermission({ role: 'TEACHER' }, PERMISSIONS.ACADEMIC_MANAGE), false);
  assert.equal(hasPermission({ role: 'PUBLIC_USER' }, PERMISSIONS.ACADEMIC_MANAGE), false);
});

test('academic admin routes reject non-admin users before request validation', async () => {
  const app = express();
  app.use(attachRequestId);
  app.use(express.json());
  app.use('/api/v1/admin/academics', academicRoutes);
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const token = createAccessToken({ _id: { toString: () => ids.class }, role: 'PUBLIC_USER' }, 'academic-public-user');
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/admin/academics/classes`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ invalid: true }),
    });
    const body = await response.json();
    assert.equal(response.status, 403);
    assert.equal(body.error.code, 'FORBIDDEN');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test('academic admin routes validate requests after a permitted administrator is authenticated', async () => {
  const app = express();
  app.use(attachRequestId);
  app.use(express.json());
  app.use('/api/v1/admin/academics', academicRoutes);
  app.use(errorHandler);
  const token = createAccessToken({ _id: { toString: () => ids.class }, role: 'ADMIN' }, 'academic-admin-session');
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/admin/academics/sessions`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ sessionName: '', startDate: 'bad-date', endDate: '2026-01-01', extra: true }),
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(body.error.details.some((detail) => detail.field === 'extra'));
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});