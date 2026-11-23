const test = require('node:test');
const assert = require('node:assert/strict');
const Assignment = require('../models/assignment/Assignment');
const Submission = require('../models/assignment/Submission');
const { createAssignmentService } = require('../services/assignment/assignment.service');
const { hasPermission } = require('../authorization/services/permission.service');
const { PERMISSIONS } = require('../authorization/constants/permissions.constants');
const { createAccessToken } = require('../services/auth/token.service');
const { createAssignmentUploadMiddleware } = require('../middleware/assignment-upload.middleware');
const { errorHandler } = require('../middleware/error.middleware');
const { attachRequestId } = require('../middleware/requestId.middleware');
const express = require('express');

const objectId = () => '64b000000000000000000001';

const metadata = {
  provider: 'cloudinary',
  publicId: 'eduos/submissions/file-id',
  resourceType: 'raw',
  format: 'pdf',
  mimeType: 'application/pdf',
  originalName: 'homework.pdf',
  sizeBytes: 1024,
};

const createServiceModels = (overrides = {}) => ({
  Assignment: {
    findById: () => ({ lean: async () => null }),
    create: async (data) => data,
  },
  Submission: {
    exists: async () => false,
    create: async (data) => data,
  },
  AssignmentAudit: { create: async () => [] },
  UploadPolicy: { findById: () => ({ lean: async () => null }) },
  AcademicSession: { findById: () => ({ lean: async () => ({ status: 'ACTIVE' }) }) },
  AcademicClass: { findById: () => ({ lean: async () => ({ status: 'ACTIVE' }) }) },
  Section: { findById: () => ({ lean: async () => ({ classId: objectId(), status: 'ACTIVE' }) }) },
  Subject: { findById: () => ({ lean: async () => ({ status: 'ACTIVE' }) }) },
  ClassSubject: { findOne: () => ({ lean: async () => ({ status: 'ACTIVE' }) }) },
  StudentEnrollment: { findOne: () => ({ lean: async () => ({ _id: objectId() }) }) },
  TeacherAssignment: { exists: async () => false },
  ParentStudent: { find: () => ({ select: () => ({ lean: async () => [] }) }), exists: async () => false },
  ...overrides,
});

test('Group 12 assignment schema requires academic context and restricts lifecycle values', async () => {
  const assignment = new Assignment({
    title: 'Homework',
    description: 'Complete the worksheet.',
    academicSessionId: objectId(),
    classId: objectId(),
    sectionId: objectId(),
    subjectId: objectId(),
    createdBy: objectId(),
    dueAt: new Date('2026-10-20T12:00:00.000Z'),
    status: 'PUBLISHED',
  });

  await assignment.validate();
  assert.equal(assignment.status, 'PUBLISHED');
  assert.equal(assignment.attachments.length, 0);
  assert.equal(assignment.publishedAt, null);
});

test('Group 12 submission schema records user identity and private storage metadata', async () => {
  const submission = new Submission({
    assignmentId: objectId(),
    studentUserId: objectId(),
    enrollmentId: objectId(),
    file: metadata,
    submittedAt: new Date(),
    status: 'LATE',
  });

  await submission.validate();
  assert.equal(submission.status, 'LATE');
  assert.equal(submission.file.publicId, metadata.publicId);
  assert.equal(submission.toObject().file.url, undefined);
});

test('Group 12 submission rejects client-controlled unknown ownership fields', () => {
  assert.throws(() => new Submission({
    assignmentId: objectId(),
    studentUserId: objectId(),
    enrollmentId: objectId(),
    file: metadata,
    submittedAt: new Date(),
    status: 'ON_TIME',
    userId: objectId(),
  }), /userId/);
});

test('Group 12 submission has a unique current record per assignment and student', () => {
  const uniqueIndex = Submission.schema.indexes().find(([keys, options]) => (
    keys.assignmentId === 1 && keys.studentUserId === 1 && options.unique === true
  ));

  assert.ok(uniqueIndex);
});

test('Group 12 accepts a first submission after the deadline and calculates LATE on the server', async () => {
  const assignmentId = objectId();
  let createdSubmission;
  const service = createAssignmentService({
    models: createServiceModels({
      Assignment: {
        findById: () => ({ lean: async () => ({ _id: assignmentId, dueAt: new Date('2026-10-01'), status: 'PUBLISHED' }) }),
        findOneAndUpdate: () => ({ lean: async () => ({ _id: assignmentId, dueAt: new Date('2026-10-01'), status: 'PUBLISHED' }) }),
      },
      Submission: {
        exists: async () => false,
        create: async (data) => { createdSubmission = data[0]; return data; },
      },
      StudentEnrollment: { findOne: () => ({ session() { return this; }, lean: async () => ({ _id: objectId() }) }) },
    }),
    storage: { upload: async () => metadata, destroy: async () => {} },
    runInTransaction: async (operation) => operation({}),
    now: () => new Date('2026-10-02'),
  });

  await service.submitFile({ actor: { sub: objectId(), role: 'STUDENT' }, assignmentId, file: { sizeBytes: 1024 } });

  assert.equal(createdSubmission.status, 'LATE');
  assert.equal(createdSubmission.submittedAt.toISOString(), '2026-10-02T00:00:00.000Z');
});

test('Group 12 rejects an unassigned teacher before uploading an attachment', async () => {
  let uploadCalls = 0;
  const service = createAssignmentService({
    models: createServiceModels({
      Assignment: { findById: () => ({ lean: async () => ({
        _id: objectId(),
        academicSessionId: objectId(),
        classId: objectId(),
        sectionId: objectId(),
        subjectId: objectId(),
        createdBy: objectId(),
        status: 'DRAFT',
        attachments: [],
      }) }) },
      TeacherAssignment: { exists: async () => false },
    }),
    storage: { upload: async () => { uploadCalls += 1; return metadata; }, destroy: async () => {} },
  });

  await assert.rejects(service.uploadAttachment({
    actor: { sub: objectId(), role: 'TEACHER' },
    assignmentId: objectId(),
    file: { sizeBytes: 1024 },
  }), { statusCode: 403 });
  assert.equal(uploadCalls, 0);
});

test('Group 12 permissions separate teacher management, student submissions, and admin upload settings', () => {
  assert.equal(hasPermission({ role: 'TEACHER' }, PERMISSIONS.ASSIGNMENT_CREATE), true);
  assert.equal(hasPermission({ role: 'TEACHER' }, PERMISSIONS.SUBMISSION_UPLOAD), false);
  assert.equal(hasPermission({ role: 'STUDENT' }, PERMISSIONS.SUBMISSION_UPLOAD), true);
  assert.equal(hasPermission({ role: 'STUDENT' }, PERMISSIONS.ASSIGNMENT_DEADLINE_EXTEND), false);
  assert.equal(hasPermission({ role: 'ADMIN' }, PERMISSIONS.UPLOAD_POLICY_MANAGE), true);
  assert.equal(hasPermission({ role: 'PUBLIC_USER' }, PERMISSIONS.UPLOAD_POLICY_MANAGE), false);
});

test('Group 12 teacher assignment route denies PUBLIC_USER before validating request data', async () => {
  const app = express();
  app.use(attachRequestId);
  app.use(express.json());
  app.use('/api/v1', require('../routes/assignment.routes'));
  app.use(errorHandler);
  const token = createAccessToken({ _id: { toString: () => objectId() }, role: 'PUBLIC_USER' }, 'group12-public');
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/teacher/assignments`, {
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

test('Group 12 multipart boundary rejects MIME-spoofed files and enforces configured byte limits', async () => {
  const upload = createAssignmentUploadMiddleware({
    getUploadPolicy: async () => ({ attachmentMaxBytes: 1024, submissionMaxBytes: 1024, hardLimitBytes: 2048 }),
  });
  const app = express();
  app.use(attachRequestId);
  app.post('/upload', upload.receiveAssignmentFile('submission'), (req, res) => res.json({
    mimeType: req.assignmentFile.mimeType,
    format: req.assignmentFile.format,
    sizeBytes: req.assignmentFile.sizeBytes,
  }));
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const endpoint = `http://127.0.0.1:${server.address().port}/upload`;

  try {
    const spoofed = new FormData();
    spoofed.append('file', new Blob([Buffer.from('MZ executable bytes')], { type: 'application/pdf' }), 'spoof.pdf');
    const spoofedResponse = await fetch(endpoint, { method: 'POST', body: spoofed });
    const spoofedBody = await spoofedResponse.json();
    assert.equal(spoofedResponse.status, 415);
    assert.equal(spoofedBody.error.code, 'UNSUPPORTED_FILE_TYPE');

    const oversized = new FormData();
    oversized.append('file', new Blob([Buffer.alloc(2048, 65)], { type: 'application/pdf' }), 'large.pdf');
    const oversizedResponse = await fetch(endpoint, { method: 'POST', body: oversized });
    const oversizedBody = await oversizedResponse.json();
    assert.equal(oversizedResponse.status, 413);
    assert.equal(oversizedBody.error.code, 'UPLOAD_LIMIT_EXCEEDED');

    const valid = new FormData();
    valid.append('file', new Blob([Buffer.from('%PDF-1.7\nGroup 12 test')], { type: 'text/plain' }), 'valid.pdf');
    const validResponse = await fetch(endpoint, { method: 'POST', body: valid });
    assert.equal(validResponse.status, 200);
    assert.deepEqual(await validResponse.json(), { mimeType: 'application/pdf', format: 'pdf', sizeBytes: 22 });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test('Group 12 deadline extension recalculates existing submission status and writes an audit record', async () => {
  const originalDeadline = new Date('2026-10-20T00:00:00.000Z');
  const extendedDeadline = new Date('2026-10-25T00:00:00.000Z');
  let statusUpdate;
  let auditEntry;
  const assignment = {
    _id: objectId(),
    dueAt: originalDeadline,
    status: 'PUBLISHED',
    academicSessionId: objectId(),
    classId: objectId(),
    sectionId: objectId(),
    subjectId: objectId(),
  };
  const service = createAssignmentService({
    models: createServiceModels({
      Assignment: {
        findById: () => ({ lean: async () => assignment }),
        findOneAndUpdate: () => ({ lean: async () => ({ ...assignment, dueAt: extendedDeadline }) }),
      },
      TeacherAssignment: { exists: async () => true },
      Submission: { updateMany: async (filter, update, options) => { statusUpdate = { filter, update, options }; } },
      AssignmentAudit: { create: async ([entry]) => { auditEntry = entry; } },
    }),
    now: () => new Date('2026-10-24T00:00:00.000Z'),
    runInTransaction: async (operation) => operation({ transaction: true }),
  });

  const updated = await service.extendDeadline({
    actor: { sub: objectId(), role: 'TEACHER' },
    assignmentId: assignment._id,
    dueAt: extendedDeadline,
    reason: 'Approved extension',
  });

  assert.equal(updated.dueAt, extendedDeadline);
  assert.equal(statusUpdate.filter.assignmentId, assignment._id);
  assert.deepEqual(statusUpdate.update[0].$set.status, {
    $cond: [{ $lte: ['$submittedAt', extendedDeadline] }, 'ON_TIME', 'LATE'],
  });
  assert.equal(statusUpdate.options.session.transaction, true);
  assert.equal(auditEntry.action, 'DEADLINE_EXTENDED');
  assert.equal(auditEntry.previousValue.dueAt, originalDeadline);
});

test('Group 12 replacement stores the new file before updating and deletes the old file afterward', async () => {
  const assignment = {
    _id: objectId(),
    dueAt: new Date('2026-10-25T00:00:00.000Z'),
    status: 'PUBLISHED',
  };
  const submission = {
    _id: objectId(),
    assignmentId: assignment._id,
    studentUserId: objectId(),
    file: { ...metadata, publicId: 'old-file' },
  };
  const newFile = { ...metadata, publicId: 'new-file' };
  const events = [];
  const service = createAssignmentService({
    models: createServiceModels({
      Assignment: {
        findById: () => ({ lean: async () => assignment }),
        findOneAndUpdate: () => ({ lean: async () => assignment }),
      },
      Submission: {
        findById: () => ({ lean: async () => submission }),
        findOneAndUpdate: (filter, update) => ({
          lean: async () => {
            events.push('database-update');
            assert.equal(filter['file.publicId'], 'old-file');
            return { ...submission, file: update.$set.file, status: update.$set.status };
          },
        }),
      },
      StudentEnrollment: { findOne: () => ({ session() { return this; }, lean: async () => ({ _id: objectId() }) }) },
    }),
    storage: {
      upload: async () => { events.push('upload-new'); return newFile; },
      destroy: async (publicId) => { events.push(`delete-${publicId}`); },
    },
    now: () => new Date('2026-10-24T00:00:00.000Z'),
    runInTransaction: async (operation) => operation({}),
  });

  const replaced = await service.replaceSubmissionFile({
    actor: { sub: submission.studentUserId, role: 'STUDENT' },
    submissionId: submission._id,
    file: { sizeBytes: 1024 },
  });

  assert.equal(replaced.file.publicId, 'new-file');
  assert.deepEqual(events, ['upload-new', 'database-update', 'delete-old-file']);
});

test('Group 12 blocks replacement after the effective deadline without uploading', async () => {
  let uploadCalls = 0;
  const assignment = { _id: objectId(), dueAt: new Date('2026-10-20'), status: 'PUBLISHED' };
  const submission = { _id: objectId(), assignmentId: assignment._id, studentUserId: objectId(), file: metadata };
  const service = createAssignmentService({
    models: createServiceModels({
      Submission: { findById: () => ({ lean: async () => submission }) },
      Assignment: { findById: () => ({ lean: async () => assignment }) },
    }),
    storage: { upload: async () => { uploadCalls += 1; return metadata; }, destroy: async () => {} },
    now: () => new Date('2026-10-21'),
  });

  await assert.rejects(service.replaceSubmissionFile({
    actor: { sub: submission.studentUserId, role: 'STUDENT' },
    submissionId: submission._id,
    file: { sizeBytes: 1024 },
  }), { code: 'REPLACEMENT_DEADLINE_PASSED' });
  assert.equal(uploadCalls, 0);
});

test('Group 12 administrator upload policy cannot exceed the absolute hard limit', async () => {
  let transactionCalls = 0;
  const service = createAssignmentService({
    models: createServiceModels(),
    runInTransaction: async (operation) => { transactionCalls += 1; return operation({}); },
  });

  await assert.rejects(service.updateUploadLimits({
    actor: { sub: objectId(), role: 'ADMIN' },
    attachmentMaxBytes: 50 * 1024 * 1024 + 1,
    submissionMaxBytes: 20 * 1024 * 1024,
  }), { code: 'UPLOAD_LIMIT_ABOVE_HARD_CAP' });
  assert.equal(transactionCalls, 0);
});

test('Group 12 database failure after storage upload triggers cleanup and logs cleanup failure', async () => {
  const assignment = {
    _id: objectId(),
    dueAt: new Date('2026-10-25'),
    status: 'PUBLISHED',
  };
  let cleanupCalls = 0;
  let logEntry;
  const service = createAssignmentService({
    models: createServiceModels({
      Assignment: {
        findById: () => ({ lean: async () => assignment }),
        findOneAndUpdate: () => ({ lean: async () => assignment }),
      },
      StudentEnrollment: { findOne: () => ({ session() { return this; }, lean: async () => ({ _id: objectId() }) }) },
      Submission: { exists: async () => false, create: async () => { throw new Error('database write failed'); } },
    }),
    storage: {
      upload: async () => metadata,
      destroy: async () => { cleanupCalls += 1; throw new Error('storage cleanup failed'); },
    },
    logger: { error: (message, context) => { logEntry = { message, context }; } },
    now: () => new Date('2026-10-24'),
    runInTransaction: async (operation) => operation({}),
  });

  await assert.rejects(service.submitFile({
    actor: { sub: objectId(), role: 'STUDENT' },
    assignmentId: assignment._id,
    file: { sizeBytes: 1024 },
  }), /database write failed/);
  assert.equal(cleanupCalls, 1);
  assert.equal(logEntry.message, 'Group 12 obsolete-file cleanup failed');
  assert.equal(logEntry.context.publicId, metadata.publicId);
});