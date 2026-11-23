const test = require('node:test');
const assert = require('node:assert/strict');

process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/attendance-tests';
process.env.JWT_ACCESS_SECRET ||= 'attendance-tests-access-secret';
process.env.JWT_REFRESH_SECRET ||= 'attendance-tests-refresh-secret';

const express = require('express');
const Attendance = require('../models/attendance/Attendance');
const StudentEnrollment = require('../models/student/StudentEnrollment');
const TeacherAssignment = require('../models/teacher/TeacherAssignment');
const { createAttendanceService } = require('../services/attendance/attendance.service');
const { createAccessToken } = require('../services/auth/token.service');
const { hasPermission } = require('../authorization/services/permission.service');
const { PERMISSIONS } = require('../authorization/constants/permissions.constants');
const attendanceRoutes = require('../routes/attendance.routes');
const adminAttendanceRoutes = require('../routes/admin/attendance.routes');
const { errorHandler } = require('../middleware/error.middleware');
const { attachRequestId } = require('../middleware/requestId.middleware');
const validators = require('../validators/attendance/attendance.validator');
const { getDayBounds, isDateKey } = require('../utils/attendanceDate');

const ids = {
  admin: '64b000000000000000000001',
  teacher: '64b000000000000000000002',
  studentOne: '64b000000000000000000003',
  studentTwo: '64b000000000000000000004',
  session: '64b000000000000000000005',
  class: '64b000000000000000000006',
  section: '64b000000000000000000007',
  enrollmentOne: '64b000000000000000000008',
  enrollmentTwo: '64b000000000000000000009',
  attendanceOne: '64b000000000000000000010',
};

const createModels = ({ assignedTeacher = true, linkedParent = true } = {}) => {
  const records = [];
  const enrollments = [
    {
      _id: ids.enrollmentOne,
      studentUserId: ids.studentOne,
      academicSessionId: ids.session,
      classId: ids.class,
      sectionId: ids.section,
      status: 'ACTIVE',
      validFrom: new Date('2026-08-01T00:00:00.000Z'),
      validTo: null,
    },
    {
      _id: ids.enrollmentTwo,
      studentUserId: ids.studentTwo,
      academicSessionId: ids.session,
      classId: ids.class,
      sectionId: ids.section,
      status: 'ACTIVE',
      validFrom: new Date('2026-08-01T00:00:00.000Z'),
      validTo: null,
    },
  ];
  const models = {
    Attendance: {
      records,
      exists: async ({ enrollmentId, attendanceDate }) => records.some((record) => (
        (enrollmentId.$in || []).some((id) => id === record.enrollmentId)
        && record.attendanceDate === attendanceDate
      )),
      insertMany: async (items) => {
        for (const item of items) {
          if (records.some((record) => record.enrollmentId === item.enrollmentId
            && record.attendanceDate === item.attendanceDate)) {
            const duplicate = new Error('duplicate');
            duplicate.code = 11000;
            throw duplicate;
          }
        }
        const created = items.map((item, index) => ({ _id: `${String(index + 11).padStart(24, '0')}`, ...item }));
        records.push(...created);
        return created;
      },
      find: (query) => ({
        sort() { return this; },
        limit(value) { this.max = value; return this; },
        lean: async function lean() {
          return records.filter((record) => Object.entries(query).every(([key, value]) => record[key] === value))
            .slice(0, this.max);
        },
      }),
      findById: (id) => ({ lean: async () => records.find((record) => record._id === id) || null }),
      findOneAndUpdate: async (filter, update) => {
        const record = records.find((item) => item._id === filter._id && item.status === filter.status);
        if (!record) return null;
        Object.assign(record, update.$set);
        return record;
      },
    },
    AcademicSession: {
      findById: () => ({ lean: async () => ({
        _id: ids.session,
        startDate: new Date('2026-08-01T00:00:00.000Z'),
        endDate: new Date('2027-06-30T00:00:00.000Z'),
        status: 'ACTIVE',
      }) }),
    },
    AcademicClass: { findById: () => ({ lean: async () => ({ _id: ids.class, status: 'ACTIVE' }) }) },
    Section: { findById: () => ({ lean: async () => ({ _id: ids.section, classId: ids.class, status: 'ACTIVE' }) }) },
    StudentEnrollment: {
      find: (query) => ({ lean: async () => enrollments.filter((record) => (
        query._id.$in.includes(record._id)
        && query.academicSessionId === record.academicSessionId
        && query.classId === record.classId
        && query.sectionId === record.sectionId
        && query.status.$in.includes(record.status)
        && record.validFrom <= query.validFrom.$lte
      )) }),
    },
    TeacherAssignment: { exists: async () => assignedTeacher },
    ParentStudent: { exists: async () => linkedParent },
    User: {},
  };
  return models;
};

const payload = {
  academicSessionId: ids.session,
  classId: ids.class,
  attendanceDate: '2026-10-08',
  records: [
    { enrollmentId: ids.enrollmentOne, status: 'PRESENT' },
    { enrollmentId: ids.enrollmentTwo, status: 'ABSENT' },
  ],
};

const makeService = (models, now = () => new Date('2026-10-08T12:00:00.000Z')) => createAttendanceService({
  models,
  timeZone: 'UTC',
  now,
  runInTransaction: async (operation) => operation(null),
});

test('attendance dates are strict calendar dates and respect daylight-saving day boundaries', () => {
  assert.equal(isDateKey('2026-02-29'), false);
  assert.equal(isDateKey('2028-02-29'), true);
  const berlinDay = getDayBounds('2026-03-29', 'Europe/Berlin');
  assert.equal(berlinDay.end.getTime() - berlinDay.start.getTime() + 1, 23 * 60 * 60 * 1000);
});

test('attendance request schemas reject duplicate enrollments and client-controlled identity fields', () => {
  assert.equal(validators.markBatchSchema.safeParse({
    ...payload,
    records: [payload.records[0], payload.records[0]],
  }).success, false);
  assert.equal(validators.markBatchSchema.safeParse({ ...payload, studentUserId: ids.studentOne }).success, false);
  assert.equal(validators.correctionSchema.safeParse({ status: 'PRESENT', reason: 'ok' }).success, false);
});

test('attendance batch creation binds identities to valid enrollments and records the authenticated marker', async () => {
  const models = createModels();
  const service = makeService(models);
  const result = await service.markSectionAttendance({
    actor: { sub: ids.admin, role: 'ADMIN' },
    sectionId: ids.section,
    payload,
  });

  assert.equal(result.length, 2);
  assert.equal(result[0].studentUserId, ids.studentOne);
  assert.equal(result[0].markedBy, ids.admin);
  assert.equal(result[1].status, 'ABSENT');
});

test('session calendar dates do not shift in time zones west of UTC', async () => {
  const models = createModels();
  const service = createAttendanceService({
    models,
    timeZone: 'America/Los_Angeles',
    runInTransaction: async (operation) => operation(null),
  });
  const [record] = await service.markSectionAttendance({
    actor: { sub: ids.admin, role: 'ADMIN' },
    sectionId: ids.section,
    payload: {
      ...payload,
      attendanceDate: '2026-08-01',
      records: [{ enrollmentId: ids.enrollmentOne, status: 'PRESENT' }],
    },
  });
  assert.equal(record.attendanceDate, '2026-08-01');
});

test('attendance batches reject duplicates and invalid enrollment context without partial writes', async () => {
  const models = createModels();
  const service = makeService(models);
  const actor = { sub: ids.admin, role: 'ADMIN' };
  await service.markSectionAttendance({ actor, sectionId: ids.section, payload });
  await assert.rejects(service.markSectionAttendance({ actor, sectionId: ids.section, payload }), {
    statusCode: 409,
    code: 'ATTENDANCE_ALREADY_RECORDED',
  });
  await assert.rejects(service.markSectionAttendance({
    actor,
    sectionId: ids.section,
    payload: { ...payload, records: [{ enrollmentId: '64b000000000000000000099', status: 'PRESENT' }] },
  }), { statusCode: 400, code: 'INVALID_ATTENDANCE_ENROLLMENT' });
  assert.equal(models.Attendance.records.length, 2);
});

test('teachers need an assignment for the exact session and section', async () => {
  const service = makeService(createModels({ assignedTeacher: false }));
  await assert.rejects(service.markSectionAttendance({
    actor: { sub: ids.teacher, role: 'TEACHER' },
    sectionId: ids.section,
    payload,
  }), { statusCode: 403 });
});

test('attendance corrections require an administrator and retain the actor and reason', async () => {
  const models = createModels();
  const service = makeService(models);
  const [record] = await service.markSectionAttendance({
    actor: { sub: ids.admin, role: 'ADMIN' },
    sectionId: ids.section,
    payload: { ...payload, records: [payload.records[0]] },
  });
  const corrected = await service.correctAttendance({
    actor: { sub: ids.admin, role: 'ADMIN' },
    recordId: record._id,
    status: 'ABSENT',
    reason: 'Verified against the signed register',
  });

  assert.equal(corrected.status, 'ABSENT');
  assert.equal(corrected.updatedBy, ids.admin);
  assert.equal(corrected.lastCorrectionReason, 'Verified against the signed register');
  await assert.rejects(service.correctAttendance({
    actor: { sub: ids.teacher, role: 'TEACHER' },
    recordId: record._id,
    status: 'PRESENT',
    reason: 'Not permitted',
  }), { statusCode: 403 });
});

test('concurrent attendance corrections do not silently overwrite an earlier update', async () => {
  const models = createModels();
  const service = makeService(models);
  const [record] = await service.markSectionAttendance({
    actor: { sub: ids.admin, role: 'ADMIN' },
    sectionId: ids.section,
    payload: { ...payload, records: [payload.records[0]] },
  });
  models.Attendance.findOneAndUpdate = async () => null;

  await assert.rejects(service.correctAttendance({
    actor: { sub: ids.admin, role: 'ADMIN' },
    recordId: record._id,
    status: 'ABSENT',
    reason: 'Verified against register',
  }), { statusCode: 409, code: 'ATTENDANCE_CHANGED' });
});

test('student and parent history reads are scoped to their own or actively linked student', async () => {
  const models = createModels({ linkedParent: false });
  const service = makeService(models);
  await assert.rejects(service.listStudentAttendance({
    actor: { sub: ids.studentOne, role: 'STUDENT' },
    studentUserId: ids.studentTwo,
    filters: { limit: 10 },
  }), { statusCode: 403 });
  await assert.rejects(service.listStudentAttendance({
    actor: { sub: ids.admin, role: 'PARENT' },
    studentUserId: ids.studentOne,
    filters: { limit: 10 },
  }), { statusCode: 403 });
});

test('attendance permissions allow teachers to mark and admins alone to correct', () => {
  assert.equal(hasPermission({ role: 'ADMIN' }, PERMISSIONS.ATTENDANCE_CORRECT), true);
  assert.equal(hasPermission({ role: 'TEACHER' }, PERMISSIONS.ATTENDANCE_CORRECT), false);
  assert.equal(hasPermission({ role: 'TEACHER' }, PERMISSIONS.ATTENDANCE_MARK), true);
  assert.equal(hasPermission({ role: 'STUDENT' }, PERMISSIONS.ATTENDANCE_MARK), false);
  assert.ok(Attendance.schema.indexes().some(([keys, options]) => (
    keys.enrollmentId === 1 && keys.attendanceDate === 1 && options.unique === true
  )));
  assert.equal(StudentEnrollment.schema.path('sectionId').options.ref, 'Section');
  assert.equal(TeacherAssignment.schema.path('sectionId').options.ref, 'Section');
});

test('attendance HTTP routes enforce permissions before processing payloads', async () => {
  const app = express();
  app.use(attachRequestId);
  app.use(express.json());
  app.use('/api/v1/attendance', attendanceRoutes);
  app.use('/api/v1/admin/attendance', adminAttendanceRoutes);
  app.use(errorHandler);
  const studentToken = createAccessToken({ _id: { toString: () => ids.studentOne }, role: 'STUDENT' }, 'attendance-student');
  const adminToken = createAccessToken({ _id: { toString: () => ids.admin }, role: 'ADMIN' }, 'attendance-admin');
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const denied = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/attendance/sections/${ids.section}/mark`, {
      method: 'POST',
      headers: { authorization: `Bearer ${studentToken}`, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assert.equal(denied.status, 403);

    const invalidCorrection = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/admin/attendance/${ids.attendanceOne}`, {
      method: 'PATCH',
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'PRESENT' }),
    });
    const body = await invalidCorrection.json();
    assert.equal(invalidCorrection.status, 400);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.ok(body.error.details.some((detail) => detail.field === 'reason'));
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});