const test = require('node:test');
const assert = require('node:assert/strict');

process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/examination-tests';
process.env.JWT_ACCESS_SECRET ||= 'examination-tests-access-secret';
process.env.JWT_REFRESH_SECRET ||= 'examination-tests-refresh-secret';

const express = require('express');
const { createAccessToken } = require('../services/auth/token.service');
const { errorHandler } = require('../middleware/error.middleware');
const { attachRequestId } = require('../middleware/requestId.middleware');
const examinationRoutes = require('../routes/examination.routes');
const validators = require('../validators/examination/examination.validator');
const { hasPermission } = require('../authorization/services/permission.service');
const { PERMISSIONS } = require('../authorization/constants/permissions.constants');
const { createExamService } = require('../services/examination/exam.service');
const { createMarksService } = require('../services/examination/marks.service');
const { createResultService } = require('../services/examination/result.service');
const { createResultPublishingService } = require('../services/examination/resultPublishing.service');
const ApiError = require('../utils/ApiError');
const {
  validateGradeBands,
  gradeForPercentage,
} = require('../services/examination/examination.helpers');

const ids = {
  admin: '64b000000000000000000001',
  teacher: '64b000000000000000000002',
  studentOne: '64b000000000000000000003',
  studentTwo: '64b000000000000000000004',
  exam: '64b000000000000000000005',
  scheduleOne: '64b000000000000000000006',
  scheduleTwo: '64b000000000000000000007',
  session: '64b000000000000000000008',
  class: '64b000000000000000000009',
  section: '64b000000000000000000010',
  subjectOne: '64b000000000000000000011',
  subjectTwo: '64b000000000000000000012',
  enrollment: '64b000000000000000000013',
};

const gradeBands = [
  { minimumPercentage: 0, maximumPercentage: 50, grade: 'F', isPassing: false },
  { minimumPercentage: 50, maximumPercentage: 90, grade: 'B', isPassing: true },
  { minimumPercentage: 90, maximumPercentage: 100, grade: 'A', isPassing: true },
];

const makeQuery = (value) => ({
  session() { return this; },
  sort() { return this; },
  select() { return this; },
  limit() { return this; },
  lean: async () => value,
});

test('Group 13 request schemas reject client-controlled lifecycle fields and fractional marks', () => {
  assert.equal(validators.examCreateSchema.safeParse({
    name: 'Final', examType: 'FINAL', academicSessionId: ids.session,
    startDate: '2026-10-10', endDate: '2026-10-11', status: 'PUBLISHED',
  }).success, false);
  assert.equal(validators.markBatchSchema.safeParse({
    records: [{ studentUserId: ids.studentOne, status: 'PRESENT', obtainedMarks: 5.5 }],
  }).success, false);
  assert.equal(validators.markBatchSchema.safeParse({
    records: [{ studentUserId: ids.studentOne, status: 'ABSENT', obtainedMarks: 0 }],
  }).success, false);
  assert.equal(validators.markBatchSchema.safeParse({
    records: [
      { studentUserId: ids.studentOne, status: 'ABSENT' },
      { studentUserId: ids.studentOne, status: 'PRESENT', obtainedMarks: 4 },
    ],
  }).success, false);
});

test('grade scales require complete contiguous ranges and use exact boundaries', () => {
  assert.deepEqual(validateGradeBands(gradeBands), gradeBands);
  assert.equal(gradeForPercentage(50, gradeBands).grade, 'B');
  assert.equal(gradeForPercentage(90, gradeBands).grade, 'A');
  assert.throws(() => validateGradeBands([
    { ...gradeBands[0], maximumPercentage: 49 },
    { ...gradeBands[1], minimumPercentage: 50 },
    gradeBands[2],
  ]), { code: 'INVALID_GRADE_SCALE' });
  assert.throws(() => validateGradeBands([
    { ...gradeBands[0], maximumPercentage: 60 },
    gradeBands[1],
    gradeBands[2],
  ]), { code: 'INVALID_GRADE_SCALE' });
});

test('teacher schedule access requires the matching academic assignment', async () => {
  let assigned = false;
  const service = createExamService({
    models: { TeacherAssignment: { exists: async () => assigned } },
  });
  const schedule = {
    teacherUserId: ids.teacher,
    academicSessionId: ids.session,
    classId: ids.class,
    sectionId: ids.section,
    subjectId: ids.subjectOne,
    startAt: new Date('2026-10-12T09:00:00Z'),
    endAt: new Date('2026-10-12T10:00:00Z'),
  };
  await assert.rejects(service.assertScheduleAccess({ sub: ids.teacher, role: 'TEACHER' }, schedule), {
    statusCode: 403,
  });
  assigned = true;
  await assert.doesNotReject(service.assertScheduleAccess({ sub: ids.teacher, role: 'TEACHER' }, schedule));
});

test('examination lifecycle rejects skipped transitions without writing a new status', async () => {
  let statusWriteCount = 0;
  const exam = { _id: ids.exam, academicSessionId: ids.session, status: 'DRAFT' };
  const service = createExamService({
    models: {
      Exam: {
        findById: () => makeQuery(exam),
        findOneAndUpdate: async () => { statusWriteCount += 1; },
      },
      AcademicSession: { findOneAndUpdate: async () => ({}) },
    },
    transaction: async (operation) => operation({}),
  });

  await assert.rejects(service.changeExamStatus({
    actor: { sub: ids.admin, role: 'ADMIN' },
    examId: ids.exam,
    status: 'IN_PROGRESS',
  }), { code: 'INVALID_EXAM_TRANSITION', statusCode: 409 });
  assert.equal(statusWriteCount, 0);
});

test('exam creation rejects an invalid academic session before writing', async () => {
  let createCount = 0;
  const service = createExamService({
    models: {
      AcademicSession: { findById: () => makeQuery(null) },
      Exam: { create: async () => { createCount += 1; } },
    },
    transaction: async (operation) => operation({}),
  });

  await assert.rejects(service.createExam({
    actor: { sub: ids.admin, role: 'ADMIN' },
    payload: {
      name: 'Final',
      examType: 'FINAL',
      academicSessionId: ids.session,
      startDate: new Date('2026-10-10T00:00:00Z'),
      endDate: new Date('2026-10-11T00:00:00Z'),
    },
  }), { code: 'INVALID_ACADEMIC_SESSION', statusCode: 400 });
  assert.equal(createCount, 0);
});

test('schedule creation rejects an overlapping section booking before insert', async () => {
  let createCount = 0;
  const query = (value) => ({
    session() { return this; },
    lean: async () => value,
  });
  const promiseQuery = (value) => ({
    session() { return this; },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
  });
  const exam = {
    _id: ids.exam,
    academicSessionId: ids.session,
    status: 'DRAFT',
    startDate: new Date('2026-10-10T00:00:00Z'),
    endDate: new Date('2026-10-12T00:00:00Z'),
  };
  const service = createExamService({
    models: {
      Exam: { findById: () => query(exam) },
      AcademicSession: {
        findOneAndUpdate: async () => ({}),
        findById: () => query({
          status: 'ACTIVE',
          startDate: new Date('2026-01-01T00:00:00Z'),
          endDate: new Date('2026-12-31T00:00:00Z'),
        }),
      },
      AcademicClass: { findById: () => query({ status: 'ACTIVE' }) },
      Section: { findById: () => query({ status: 'ACTIVE', classId: ids.class }) },
      Subject: { findById: () => query({ status: 'ACTIVE' }) },
      ClassSubject: { findOne: () => query({ _id: ids.subjectOne }) },
      ExamSchedule: {
        exists: () => promiseQuery(true),
        create: async () => { createCount += 1; },
      },
    },
    transaction: async (operation) => operation({}),
  });

  await assert.rejects(service.createSchedule({
    actor: { sub: ids.admin, role: 'ADMIN' },
    examId: ids.exam,
    payload: {
      classId: ids.class,
      sectionId: ids.section,
      subjectId: ids.subjectOne,
      startAt: new Date('2026-10-11T09:00:00Z'),
      endAt: new Date('2026-10-11T10:00:00Z'),
      maximumMarks: 100,
    },
  }), { code: 'EXAM_SCHEDULE_CONFLICT', statusCode: 409 });
  assert.equal(createCount, 0);
});

test('marks cannot be changed through ordinary entry after a result is finalized', async () => {
  let writeCount = 0;
  const service = createMarksService({
    models: {
      Result: { findOne: () => makeQuery({ _id: ids.scheduleTwo, status: 'FINALIZED' }) },
      Mark: { findOneAndUpdate: async () => { writeCount += 1; } },
      ExamAudit: { create: async () => {} },
    },
    examinations: {
      getSchedule: async () => ({ _id: ids.scheduleOne, examId: ids.exam, maximumMarks: 100 }),
      assertScheduleAccess: async () => {},
      getExam: async () => ({ _id: ids.exam, status: 'RESULTS_READY' }),
      lockExamWorkflow: async () => {},
      validEnrollmentsForSchedule: async () => [{ _id: ids.enrollment, studentUserId: ids.studentOne }],
    },
    transaction: async (operation) => operation({}),
  });

  await assert.rejects(service.enterMarks({
    actor: { sub: ids.teacher, role: 'TEACHER' },
    scheduleId: ids.scheduleOne,
    records: [{ studentUserId: ids.studentOne, status: 'PRESENT', obtainedMarks: 90 }],
  }), { code: 'RESULT_MARKS_LOCKED', statusCode: 409 });
  assert.equal(writeCount, 0);
});

test('publication rejects an eligible result that has not been finalized', async () => {
  const service = createResultPublishingService({
    models: {
      Result: { findOne: () => makeQuery({ _id: ids.enrollment, status: 'DRAFT' }) },
    },
    examinations: {
      getExam: async () => ({ _id: ids.exam, academicSessionId: ids.session, status: 'RESULTS_READY' }),
      lockExamWorkflow: async () => {},
    },
    results: {
      lockGradeScale: async () => {},
      collectResultRows: async () => [{ studentUserId: ids.studentOne }],
    },
    transaction: async (operation) => operation({}),
  });

  await assert.rejects(service.publishResults({
    actor: { sub: ids.admin, role: 'ADMIN' },
    examId: ids.exam,
  }), { code: 'RESULTS_NOT_FINALIZED', statusCode: 409 });
});

test('repeated publication is idempotent for already published results', async () => {
  let publishWriteCount = 0;
  let auditWriteCount = 0;
  const publishedResult = { _id: ids.enrollment, status: 'PUBLISHED' };
  const service = createResultPublishingService({
    models: {
      Result: {
        findOne: () => makeQuery(publishedResult),
        findOneAndUpdate: async () => { publishWriteCount += 1; },
      },
      ExamAudit: { create: async () => { auditWriteCount += 1; } },
    },
    examinations: {
      getExam: async () => ({ _id: ids.exam, academicSessionId: ids.session, status: 'RESULTS_READY' }),
      lockExamWorkflow: async () => {},
    },
    results: {
      lockGradeScale: async () => {},
      collectResultRows: async () => [{ studentUserId: ids.studentOne }],
    },
    transaction: async (operation) => operation({}),
  });

  const results = await service.publishResults({
    actor: { sub: ids.admin, role: 'ADMIN' },
    examId: ids.exam,
  });
  assert.deepEqual(results, [publishedResult]);
  assert.equal(publishWriteCount, 0);
  assert.equal(auditWriteCount, 0);
});

test('marks service persists present and absent marks with assignment and enrollment context', async () => {
  const storedMarks = [];
  const auditEntries = [];
  const schedule = {
    _id: ids.scheduleOne,
    examId: ids.exam,
    maximumMarks: 100,
  };
  const examinations = {
    getSchedule: async () => schedule,
    assertScheduleAccess: async () => {},
    getExam: async () => ({ _id: ids.exam, status: 'COMPLETED' }),
    lockExamWorkflow: async () => {},
    validEnrollmentsForSchedule: async () => [
      { _id: ids.enrollment, studentUserId: ids.studentOne },
      { _id: '64b000000000000000000014', studentUserId: ids.studentTwo },
    ],
  };
  const models = {
    Mark: {
      findOne: (query) => makeQuery(storedMarks.find((mark) => (
        mark.examScheduleId === query.examScheduleId && mark.studentUserId === query.studentUserId
      )) || null),
      findOneAndUpdate: async (filter, update) => {
        let mark = storedMarks.find((item) => (
          item.examScheduleId === filter.examScheduleId && item.studentUserId === filter.studentUserId
        ));
        if (!mark) {
          mark = { _id: `${storedMarks.length + 20}`.padStart(24, '0'), ...filter };
          storedMarks.push(mark);
        }
        Object.assign(mark, update.$set);
        if (!mark.enteredBy) mark.enteredBy = update.$setOnInsert.enteredBy;
        if (update.$setOnInsert.version !== undefined && mark.version === undefined) {
          mark.version = update.$setOnInsert.version;
        }
        if (update.$inc) mark.version += update.$inc.version;
        return mark;
      },
    },
    Result: { findOne: () => makeQuery(null) },
    ExamAudit: { create: async (entries) => auditEntries.push(...entries) },
  };
  const service = createMarksService({
    models,
    examinations,
    transaction: async (operation) => operation({}),
  });
  const saved = await service.enterMarks({
    actor: { sub: ids.teacher, role: 'TEACHER' },
    scheduleId: ids.scheduleOne,
    records: [
      { studentUserId: ids.studentOne, status: 'PRESENT', obtainedMarks: 84 },
      { studentUserId: ids.studentTwo, status: 'ABSENT' },
    ],
  });

  assert.equal(saved.length, 2);
  assert.equal(saved[0].obtainedMarks, 84);
  assert.equal(saved[0].enrollmentId, ids.enrollment);
  assert.equal(saved[1].status, 'ABSENT');
  assert.equal(saved[1].obtainedMarks, null);
  assert.equal(auditEntries.length, 2);
});

test('marks service rejects marks above the maximum before writing any records', async () => {
  let writeCount = 0;
  const service = createMarksService({
    models: {
      Mark: { findOneAndUpdate: async () => { writeCount += 1; } },
      Result: { findOne: () => makeQuery(null) },
      ExamAudit: { create: async () => {} },
    },
    examinations: {
      getSchedule: async () => ({ _id: ids.scheduleOne, examId: ids.exam, maximumMarks: 10 }),
      assertScheduleAccess: async () => {},
      getExam: async () => ({ _id: ids.exam, status: 'COMPLETED' }),
      lockExamWorkflow: async () => {},
      validEnrollmentsForSchedule: async () => [{ _id: ids.enrollment, studentUserId: ids.studentOne }],
    },
    transaction: async (operation) => operation({}),
  });
  await assert.rejects(service.enterMarks({
    actor: { sub: ids.teacher, role: 'TEACHER' },
    scheduleId: ids.scheduleOne,
    records: [{ studentUserId: ids.studentOne, status: 'PRESENT', obtainedMarks: 11 }],
  }), { statusCode: 400, code: 'MARKS_EXCEED_MAXIMUM' });
  assert.equal(writeCount, 0);
});

test('existing marks require the current version to prevent stale updates', async () => {
  let writeCount = 0;
  const service = createMarksService({
    models: {
      Mark: {
        findOne: () => makeQuery({ _id: ids.scheduleTwo, version: 2, status: 'PRESENT', obtainedMarks: 7 }),
        findOneAndUpdate: async () => { writeCount += 1; },
      },
      Result: { findOne: () => makeQuery(null) },
      ExamAudit: { create: async () => {} },
    },
    examinations: {
      getSchedule: async () => ({ _id: ids.scheduleOne, examId: ids.exam, maximumMarks: 10 }),
      assertScheduleAccess: async () => {},
      getExam: async () => ({ _id: ids.exam, status: 'COMPLETED' }),
      lockExamWorkflow: async () => {},
      validEnrollmentsForSchedule: async () => [{ _id: ids.enrollment, studentUserId: ids.studentOne }],
    },
    transaction: async (operation) => operation({}),
  });
  const request = {
    actor: { sub: ids.teacher, role: 'TEACHER' },
    scheduleId: ids.scheduleOne,
    records: [{ studentUserId: ids.studentOne, status: 'PRESENT', obtainedMarks: 8 }],
  };
  await assert.rejects(service.enterMarks(request), { code: 'MARK_VERSION_REQUIRED' });
  await assert.rejects(service.enterMarks({
    ...request,
    records: [{ ...request.records[0], expectedVersion: 1 }],
  }), { code: 'MARK_VERSION_CONFLICT' });
  assert.equal(writeCount, 0);
});

test('result calculation uses weighted totals, configured grades, and zero for absent students', async () => {
  const schedules = [
    { _id: ids.scheduleOne, subjectId: ids.subjectOne, maximumMarks: 20 },
    { _id: ids.scheduleTwo, subjectId: ids.subjectTwo, maximumMarks: 100 },
  ];
  const marks = [
    { examScheduleId: ids.scheduleOne, studentUserId: ids.studentOne, enrollmentId: ids.enrollment, status: 'PRESENT', obtainedMarks: 18 },
    { examScheduleId: ids.scheduleTwo, studentUserId: ids.studentOne, enrollmentId: ids.enrollment, status: 'ABSENT', obtainedMarks: null },
  ];
  const service = createResultService({
    models: {
      GradeScale: { findOne: () => makeQuery({
        _id: '64b000000000000000000015',
        gradeBands,
        calculateOverallGrade: true,
      }) },
      ExamSchedule: {
        find: () => ({
          sort() { return this; },
          lean: async () => schedules,
        }),
      },
      Mark: {
        find: (query) => makeQuery(marks.filter((mark) => String(mark.examScheduleId) === String(query.examScheduleId))),
      },
    },
    examinations: {
      validEnrollmentsForSchedule: async () => [{
        _id: ids.enrollment,
        studentUserId: ids.studentOne,
      }],
    },
  });
  const [result] = await service.collectResultRows({
    exam: { _id: ids.exam, academicSessionId: ids.session },
  });

  assert.equal(result.totalObtainedMarks, 18);
  assert.equal(result.totalMaximumMarks, 120);
  assert.equal(result.overallPercentage, 15);
  assert.equal(result.overallGrade, 'F');
  assert.equal(result.subjects[0].grade, 'A');
  assert.equal(result.subjects[1].obtainedMarks, 0);
  assert.equal(result.subjects[1].status, 'ABSENT');
});

test('result calculation rejects missing marks instead of treating them as zero', async () => {
  const service = createResultService({
    models: {
      GradeScale: { findOne: () => makeQuery({ _id: '64b000000000000000000015', gradeBands, calculateOverallGrade: false }) },
      ExamSchedule: { find: () => ({ sort() { return this; }, lean: async () => [{
        _id: ids.scheduleOne,
        subjectId: ids.subjectOne,
        maximumMarks: 20,
      }] }) },
      Mark: { find: () => makeQuery([]) },
    },
    examinations: {
      validEnrollmentsForSchedule: async () => [{ _id: ids.enrollment, studentUserId: ids.studentOne }],
    },
  });
  await assert.rejects(service.collectResultRows({
    exam: { _id: ids.exam, academicSessionId: ids.session },
  }), { statusCode: 409, code: 'EXAM_MARKS_INCOMPLETE' });
});

test('students cannot read another student result and parents need a live relationship', async () => {
  const result = {
    _id: ids.scheduleOne,
    studentUserId: ids.studentTwo,
    enrollmentId: ids.enrollment,
    gradeScaleId: ids.session,
    status: 'PUBLISHED',
  };
  const publishing = createResultPublishingService({
    models: {
      Result: {
        findOne: (query) => makeQuery(
          String(query._id) === result._id
            && String(query.studentUserId) === result.studentUserId
            && query.status === result.status
            ? result
            : null
        ),
      },
      ParentStudent: { exists: async () => false },
    },
  });
  await assert.rejects(publishing.getOwnResult({
    actor: { sub: ids.studentOne, role: 'STUDENT' },
    resultId: ids.scheduleOne,
  }), { statusCode: 404 });
  await assert.rejects(publishing.listChildResults({
    actor: { sub: ids.admin, role: 'PARENT' },
    studentUserId: ids.studentTwo,
    filters: { limit: 10 },
  }), { statusCode: 403, code: 'PARENT_STUDENT_RELATIONSHIP_REQUIRED' });
});

test('teacher result responses include only assigned subjects and omit overall totals', async () => {
  const accessibleSchedule = {
    _id: ids.scheduleOne,
    examId: ids.exam,
    teacherUserId: ids.teacher,
  };
  const inaccessibleSchedule = {
    _id: ids.scheduleTwo,
    examId: ids.exam,
    teacherUserId: ids.admin,
  };
  const result = {
    _id: ids.enrollment,
    examId: ids.exam,
    studentUserId: ids.studentOne,
    totalObtainedMarks: 70,
    totalMaximumMarks: 100,
    overallPercentage: 70,
    overallGrade: 'B',
    status: 'DRAFT',
    subjects: [
      { examScheduleId: ids.scheduleOne, obtainedMarks: 70 },
      { examScheduleId: ids.scheduleTwo, obtainedMarks: 99 },
    ],
  };
  const service = createResultPublishingService({
    models: {
      Result: { find: () => ({
        sort() { return this; },
        limit() { return this; },
        lean: async () => [result],
      }) },
      ExamSchedule: { find: () => makeQuery([accessibleSchedule, inaccessibleSchedule]) },
    },
    examinations: {
      requireExamAccess: async () => ({ _id: ids.exam }),
      assertScheduleAccess: async (actor, schedule) => {
        if (schedule._id !== ids.scheduleOne) throw new ApiError(403, 'Not assigned');
      },
      validEnrollmentsForSchedule: async () => [{ studentUserId: ids.studentOne }],
    },
  });
  const page = await service.listExamResults({
    actor: { sub: ids.teacher, role: 'TEACHER' },
    examId: ids.exam,
    filters: { limit: 10 },
  });

  assert.equal(page.items[0].subjects.length, 1);
  assert.equal(page.items[0].subjects[0].examScheduleId, ids.scheduleOne);
  assert.equal('overallPercentage' in page.items[0], false);
  assert.equal('totalObtainedMarks' in page.items[0], false);
});

test('result calculation and correction permissions are limited to administrators', () => {
  assert.equal(hasPermission({ role: 'ADMIN' }, PERMISSIONS.EXAM_RESULTS_CALCULATE), true);
  assert.equal(hasPermission({ role: 'TEACHER' }, PERMISSIONS.EXAM_RESULTS_CALCULATE), false);
  assert.equal(hasPermission({ role: 'ADMIN' }, PERMISSIONS.EXAM_RESULTS_CORRECT), true);
  assert.equal(hasPermission({ role: 'TEACHER' }, PERMISSIONS.EXAM_RESULTS_CORRECT), false);
});

test('published result corrections recalculate the subject and audit before-and-after values', async () => {
  const previousSubject = {
    examScheduleId: ids.scheduleOne,
    subjectId: ids.subjectOne,
    status: 'PRESENT',
    obtainedMarks: 70,
    maximumMarks: 100,
    percentage: 70,
    grade: 'B',
    isPassing: true,
  };
  const currentResult = {
    _id: ids.enrollment,
    examId: ids.exam,
    studentUserId: ids.studentOne,
    status: 'PUBLISHED',
    subjects: [previousSubject],
    totalObtainedMarks: 70,
    totalMaximumMarks: 100,
    overallPercentage: 70,
    overallGrade: 'B',
  };
  const correctedSubject = { ...previousSubject, obtainedMarks: 85, percentage: 85, grade: 'B' };
  const correctedResult = {
    ...currentResult,
    status: 'DRAFT',
    subjects: [correctedSubject],
    totalObtainedMarks: 85,
    overallPercentage: 85,
    correctionCount: 1,
  };
  const auditEntries = [];
  const service = createResultPublishingService({
    models: {
      Result: {
        findById: () => makeQuery(currentResult),
        findOneAndUpdate: async () => correctedResult,
      },
      Mark: {
        findOne: () => makeQuery({ _id: ids.scheduleTwo, status: 'PRESENT', obtainedMarks: 70 }),
        findOneAndUpdate: async () => ({ status: 'PRESENT', obtainedMarks: 85 }),
      },
      ExamAudit: { create: async (entries) => auditEntries.push(...entries) },
    },
    examinations: {
      lockExamWorkflow: async () => {},
      getExam: async () => ({ _id: ids.exam, academicSessionId: ids.session }),
      getSchedule: async () => ({ _id: ids.scheduleOne, examId: ids.exam, maximumMarks: 100 }),
    },
    results: {
      lockGradeScale: async () => {},
      calculateStudentResult: async () => ({ subjects: [correctedSubject] }),
    },
    transaction: async (operation) => operation({}),
  });

  await service.correctPublishedResult({
    actor: { sub: ids.admin, role: 'ADMIN' },
    resultId: ids.enrollment,
    payload: {
      examScheduleId: ids.scheduleOne,
      status: 'PRESENT',
      obtainedMarks: 85,
      reason: 'Verified against the signed mark sheet',
    },
  });

  assert.equal(auditEntries.length, 1);
  assert.deepEqual(auditEntries[0].previousValue.subject, previousSubject);
  assert.deepEqual(auditEntries[0].nextValue.subject, correctedSubject);
  assert.equal(auditEntries[0].reason, 'Verified against the signed mark sheet');
});

test('examination administration routes reject callers without academic management permission', async () => {
  const app = express();
  app.use(attachRequestId);
  app.use(express.json());
  app.use('/api/v1', examinationRoutes);
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    const token = createAccessToken({ _id: { toString: () => ids.teacher }, role: 'TEACHER' }, 'examination-teacher');
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/admin/exams`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ unexpected: true }),
    });
    const body = await response.json();
    assert.equal(response.status, 403);
    assert.equal(body.error.code, 'FORBIDDEN');

    const adminToken = createAccessToken({ _id: { toString: () => ids.admin }, role: 'ADMIN' }, 'examination-admin');
    const invalidRequest = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/admin/exams`, {
      method: 'POST',
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ unexpected: true }),
    });
    const invalidBody = await invalidRequest.json();
    assert.equal(invalidRequest.status, 400);
    assert.equal(invalidBody.error.code, 'VALIDATION_ERROR');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
