const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/communication-tests';
process.env.JWT_ACCESS_SECRET ||= 'communication-tests-access-secret';
process.env.JWT_REFRESH_SECRET ||= 'communication-tests-refresh-secret';

const { createComplaintService } = require('../services/communication/complaint.service');
const { createLeaveRequestService } = require('../services/communication/leave-request.service');
const { createAnnouncementService } = require('../services/communication/announcement.service');
const CommunicationAudit = require('../models/communication/CommunicationAudit');
const {
  createCommunicationAuditService,
  withAuditTransaction,
} = require('../services/communication/audit.service');
const { PERMISSIONS } = require('../authorization/constants/permissions.constants');
const { hasPermission } = require('../authorization/services/permission.service');
const { createAccessToken } = require('../services/auth/token.service');
const { errorHandler } = require('../middleware/error.middleware');
const { attachRequestId } = require('../middleware/requestId.middleware');
const communicationRoutes = require('../routes/communication.routes');
const validators = require('../validators/communication/communication.validator');

const noTransaction = async (operation) => operation({ testSession: true });

const createAuditModel = (entries = []) => ({
  create: async (records) => {
    entries.push(...records);
    return records;
  },
});

test('communication validator rejects invalid leave date ranges', () => {
  const result = validators.leaveRequestCreateSchema.safeParse({
    studentId: '64b000000000000000000001',
    startDate: '2026-11-30',
    endDate: '2026-11-29',
    reason: 'Medical appointment',
  });
  assert.equal(result.success, false);
});

test('complaint submission comes from authenticated actor and records audit', async () => {
  let auditEntry;
  const service = createComplaintService({
    transaction: noTransaction,
    models: {
      Complaint: {
        create: async ([data]) => [{ _id: '64b000000000000000000010', status: 'SUBMITTED', ...data }],
      },
      CommunicationAudit: {
        create: async ([entry]) => { auditEntry = entry; return [entry]; },
      },
      User: {},
    },
  });

  const complaint = await service.create({
    actor: { sub: '64b000000000000000000001', role: 'PARENT' },
    data: { category: 'Facilities', subject: 'Water issue', description: 'Water is unavailable' },
  });

  assert.equal(complaint.submittedBy, '64b000000000000000000001');
  assert.equal(auditEntry.action, 'COMPLAINT_SUBMITTED');
});

test('parent cannot submit leave for an unlinked student', async () => {
  const service = createLeaveRequestService({
    transaction: noTransaction,
    models: {
      LeaveRequest: { create: async ([data]) => [data] },
      CommunicationAudit: { create: async () => {} },
      ParentStudent: { exists: async () => null },
    },
  });

  await assert.rejects(
    service.create({
      actor: { sub: '64b000000000000000000001', role: 'PARENT' },
      data: {
        studentId: '64b000000000000000000002',
        startDate: new Date('2026-12-01'),
        endDate: new Date('2026-12-02'),
        reason: 'Family event',
      },
    }),
    (error) => error.statusCode === 403
  );
});

test('resolved complaint cannot be moved to a later status', async () => {
  let saveCount = 0;
  const complaint = {
    _id: '64b000000000000000000010',
    status: 'RESOLVED',
    assignedTo: '64b000000000000000000003',
    save: async () => { saveCount += 1; },
  };
  const service = createComplaintService({
    transaction: noTransaction,
    models: {
      Complaint: { findById: async () => complaint },
      CommunicationAudit: { create: async () => {} },
      User: {},
    },
  });

  await assert.rejects(
    service.updateStatus({
      actor: { sub: '64b000000000000000000003', role: 'TEACHER' },
      complaintId: complaint._id,
      status: 'IN_PROGRESS',
    }),
    (error) => error.statusCode === 409
  );
  assert.equal(saveCount, 0);
});

test('only administrators can publish or archive announcements', async () => {
  const service = createAnnouncementService({
    transaction: noTransaction,
    models: {
      Announcement: { findById: async () => null },
      CommunicationAudit: { create: async () => {} },
    },
  });

  await assert.rejects(
    service.publish({
      actor: { sub: '64b000000000000000000003', role: 'TEACHER' },
      announcementId: '64b000000000000000000010',
    }),
    (error) => error.statusCode === 403
  );
});

test('audit list query validates ObjectIds, dates, limits, and date order', () => {
  const valid = validators.auditListQuerySchema.safeParse({
    performedBy: '64b000000000000000000001',
    from: '2026-01-01T00:00:00Z',
    to: '2026-02-01T00:00:00Z',
    limit: '25',
  });
  assert.equal(valid.success, true);
  assert.equal(valid.data.limit, 25);
  assert.equal(valid.data.from instanceof Date, true);

  assert.equal(validators.auditListQuerySchema.safeParse({ performedBy: 'bad' }).success, false);
  assert.equal(validators.auditListQuerySchema.safeParse({ limit: '101' }).success, false);
  assert.equal(validators.auditListQuerySchema.safeParse({
    from: '2026-03-01T00:00:00Z',
    to: '2026-02-01T00:00:00Z',
  }).success, false);
  assert.equal(validators.auditParamsSchema.safeParse({
    entityType: 'UNKNOWN',
    entityId: '64b000000000000000000001',
  }).success, false);
});

test('central audit read permission is assigned to admins only', async () => {
  assert.equal(hasPermission({ role: 'ADMIN' }, PERMISSIONS.AUDIT_LOG_READ), true);
  for (const role of ['TEACHER', 'STUDENT', 'PARENT', 'PUBLIC_USER']) {
    assert.equal(hasPermission({ role }, PERMISSIONS.AUDIT_LOG_READ), false);
  }

  const audit = createCommunicationAuditService({ model: {} });
  await assert.rejects(
    audit.list({ actor: { role: 'TEACHER' }, filters: { limit: 50 } }),
    (error) => error.statusCode === 403
  );
});

test('central audit HTTP endpoints reject authenticated non-admins', async () => {
  const app = express();
  app.use(attachRequestId);
  app.use('/api/v1', communicationRoutes);
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const token = createAccessToken({
      _id: { toString: () => '64b000000000000000000001' },
      role: 'TEACHER',
    }, 'audit-read-teacher');
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/audit-logs`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 403);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('central audit list uses filters and stable cursor pagination', async () => {
  const first = {
    _id: '64b000000000000000000010',
    entityType: 'COMPLAINT',
    entityId: '64b000000000000000000011',
    action: 'COMPLAINT_STATUS_UPDATED',
    performedBy: '64b000000000000000000012',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    previousValue: { status: 'SUBMITTED' },
    newValue: { status: 'RESOLVED' },
  };
  const second = { ...first, _id: '64b000000000000000000009' };
  let receivedFilter;
  let receivedLimit;
  const model = {
    find: (filter) => {
      receivedFilter = filter;
      return {
        select() { return this; },
        sort(value) { assert.deepEqual(value, { createdAt: -1, _id: -1 }); return this; },
        limit(value) { receivedLimit = value; return this; },
        lean: async () => [first, second],
      };
    },
  };
  const audit = createCommunicationAuditService({ model });
  const page = await audit.list({
    actor: { role: 'ADMIN' },
    filters: {
      entityType: 'COMPLAINT',
      action: 'COMPLAINT_STATUS_UPDATED',
      performedBy: first.performedBy,
      from: new Date('2025-12-31T00:00:00Z'),
      to: new Date('2026-01-02T00:00:00Z'),
      limit: 1,
    },
  });

  assert.equal(receivedFilter.entityType, 'COMPLAINT');
  assert.equal(receivedFilter.action, 'COMPLAINT_STATUS_UPDATED');
  assert.equal(receivedFilter.performedBy, first.performedBy);
  assert.deepEqual(receivedFilter.createdAt, {
    $gte: new Date('2025-12-31T00:00:00Z'),
    $lte: new Date('2026-01-02T00:00:00Z'),
  });
  assert.equal(receivedLimit, 2);
  assert.equal(page.items.length, 1);
  assert.equal(page.pagination.hasMore, true);
  assert.equal(typeof page.pagination.nextCursor, 'string');
});

test('central audit rejects invalid cursors and returns detail only to admins', async () => {
  const model = {
    find: () => ({
      select() { return this; },
      sort() { return this; },
      limit() { return this; },
      lean: async () => [],
    }),
    findById: () => ({
      select() { return this; },
      lean: async () => null,
    }),
  };
  const audit = createCommunicationAuditService({ model });
  await assert.rejects(
    audit.list({ actor: { role: 'ADMIN' }, filters: { limit: 10, cursor: 'not-a-cursor' } }),
    (error) => error.statusCode === 400
  );
  await assert.rejects(
    audit.getById({ actor: { role: 'ADMIN' }, auditId: '64b000000000000000000001' }),
    (error) => error.statusCode === 404
  );
});

test('central audit detail is masked and per-record history is scoped to the route entity', async () => {
  const record = {
    _id: '64b000000000000000000010',
    entityType: 'COMPLAINT',
    entityId: '64b000000000000000000011',
    action: 'COMPLAINT_SUBMITTED',
    performedBy: '64b000000000000000000012',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    previousValue: null,
    newValue: { accessToken: 'do-not-return', status: 'SUBMITTED' },
  };
  let historyFilter;
  const model = {
    findById: () => ({
      select() { return this; },
      lean: async () => record,
    }),
    find: (filter) => {
      historyFilter = filter;
      return {
        select() { return this; },
        sort() { return this; },
        limit() { return this; },
        lean: async () => [record],
      };
    },
  };
  const audit = createCommunicationAuditService({ model });
  const detail = await audit.getById({
    actor: { role: 'ADMIN' },
    auditId: record._id,
  });
  const history = await audit.listHistory({
    actor: { role: 'ADMIN' },
    entityType: 'COMPLAINT',
    entityId: record.entityId,
    filters: {
      entityType: 'MESSAGE',
      entityId: '64b000000000000000000099',
      limit: 10,
    },
  });

  assert.deepEqual(detail.newValue, { status: 'SUBMITTED' });
  assert.equal(historyFilter.entityType, 'COMPLAINT');
  assert.equal(historyFilter.entityId, record.entityId);
  assert.deepEqual(history.items[0].newValue, { status: 'SUBMITTED' });
});

test('audit schema redacts sensitive snapshots, indexes createdAt, and blocks mutation', async () => {
  const auditRecord = new CommunicationAudit({
    entityType: 'COMPLAINT',
    entityId: '64b000000000000000000001',
    action: 'COMPLAINT_SUBMITTED',
    performedBy: '64b000000000000000000002',
    previousValue: {
      passwordHash: 'secret-hash',
      nested: { refreshToken: 'secret-token', status: 'PENDING' },
    },
    newValue: { apiSecret: 'secret-value', status: 'SUBMITTED' },
  });
  await auditRecord.validate();

  assert.deepEqual(auditRecord.previousValue, { nested: { status: 'PENDING' } });
  assert.deepEqual(auditRecord.newValue, { status: 'SUBMITTED' });
  assert.ok(CommunicationAudit.schema.indexes().some(([keys]) => keys.createdAt === -1));
  assert.equal(typeof createCommunicationAuditService({ model: {} }).update, 'undefined');
  assert.equal(typeof createCommunicationAuditService({ model: {} }).delete, 'undefined');

  await assert.rejects(
    CommunicationAudit.updateOne({ _id: auditRecord._id }, { $set: { action: 'TAMPERED' } }),
    /immutable/
  );
  await assert.rejects(
    CommunicationAudit.deleteOne({ _id: auditRecord._id }),
    /immutable/
  );
  await assert.rejects(
    CommunicationAudit.bulkWrite([{
      updateOne: { filter: { _id: auditRecord._id }, update: { $set: { action: 'TAMPERED' } } },
    }]),
    /immutable/
  );
});

test('audit transaction helper ends the session and propagates write failures', async () => {
  const expectedError = new Error('transaction write failed');
  let callbackRejected = false;
  let sessionEnded = false;
  const session = {
    withTransaction: async (operation) => {
      try {
        await operation();
      } catch (error) {
        callbackRejected = error === expectedError;
        throw error;
      }
    },
    endSession: async () => { sessionEnded = true; },
  };

  await assert.rejects(
    withAuditTransaction(async () => { throw expectedError; }, {
      startSession: async () => session,
    }),
    expectedError
  );
  assert.equal(callbackRejected, true);
  assert.equal(sessionEnded, true);
});

test('every Group 16 audited action records the authenticated actor', async () => {
  const entries = [];
  const auditModel = createAuditModel(entries);
  const actorId = '64b000000000000000000001';
  const otherId = '64b000000000000000000002';
  const entityId = '64b000000000000000000003';
  const notificationStub = { publishSafe: async () => {} };

  const conversation = {
    _id: entityId,
    status: 'ACTIVE',
    participants: [
      { userId: actorId, isActive: true },
      { userId: otherId, isActive: true },
    ],
  };
  const conversationService = require('../services/communication/conversation.service')
    .createConversationService({
      transaction: noTransaction,
      notifications: notificationStub,
      models: {
        Conversation: {
          findDirectConversation: async () => null,
          create: async ([data]) => [{ ...data, _id: entityId }],
          findById: () => ({ lean: async () => conversation }),
          findByIdAndUpdate: async () => {},
        },
        Message: { create: async ([data]) => [{ ...data, _id: otherId, createdAt: new Date() }] },
        CommunicationAudit: auditModel,
        User: {
          find: () => ({
            select() { return this; },
            lean: async () => [{ _id: actorId, role: 'ADMIN' }, { _id: otherId, role: 'TEACHER' }],
          }),
        },
      },
    });
  await conversationService.createConversation({
    actor: { sub: actorId, role: 'ADMIN' },
    participantIds: [otherId],
  });
  await conversationService.sendMessage({
    actor: { sub: actorId, role: 'ADMIN' },
    conversationId: entityId,
    content: 'hello',
  });

  const complaintDoc = {
    _id: entityId,
    status: 'IN_PROGRESS',
    assignedTo: actorId,
    submittedBy: otherId,
    save: async () => {},
  };
  const complaintService = createComplaintService({
    transaction: noTransaction,
    notifications: notificationStub,
    models: {
      Complaint: {
        create: async ([data]) => [{ ...data, _id: entityId, status: 'SUBMITTED' }],
        findById: async () => complaintDoc,
      },
      CommunicationAudit: auditModel,
      User: {
        findOne: () => ({ lean: async () => ({ _id: otherId }) }),
      },
    },
  });
  await complaintService.create({
    actor: { sub: otherId, role: 'PARENT' },
    data: { category: 'General', subject: 'Issue', description: 'Details' },
  });
  await complaintService.assign({
    actor: { sub: actorId, role: 'ADMIN' },
    complaintId: entityId,
    assignedTo: otherId,
  });
  await complaintService.updateStatus({
    actor: { sub: actorId, role: 'ADMIN' },
    complaintId: entityId,
    status: 'RESOLVED',
    resolutionNote: 'Done',
  });

  const leaveService = createLeaveRequestService({
    transaction: noTransaction,
    notifications: notificationStub,
    models: {
      LeaveRequest: {
        create: async ([data]) => [{ ...data, _id: entityId, status: 'PENDING' }],
        findById: async () => ({
          _id: entityId,
          requestedBy: otherId,
          status: 'PENDING',
          save: async () => {},
        }),
      },
      CommunicationAudit: auditModel,
      ParentStudent: { exists: async () => true },
      StudentEnrollment: {},
      TeacherAssignment: {},
      User: {},
    },
  });
  await leaveService.create({
    actor: { sub: otherId, role: 'STUDENT' },
    data: {
      studentId: otherId,
      startDate: new Date('2026-11-25'),
      endDate: new Date('2026-11-25'),
      reason: 'Appointment',
    },
  });
  await leaveService.review({
    actor: { sub: actorId, role: 'ADMIN' },
    leaveRequestId: entityId,
    status: 'APPROVED',
  });
  await leaveService.review({
    actor: { sub: actorId, role: 'ADMIN' },
    leaveRequestId: entityId,
    status: 'REJECTED',
    reviewNote: 'Insufficient information',
  });

  const announcementDoc = {
    _id: entityId,
    status: 'DRAFT',
    audience: ['ADMIN'],
    save: async () => {},
  };
  const announcementService = createAnnouncementService({
    transaction: noTransaction,
    notifications: notificationStub,
    models: {
      Announcement: {
        create: async ([data]) => [{ ...data, _id: entityId }],
        findById: async () => announcementDoc,
      },
      CommunicationAudit: auditModel,
      User: {
        find: () => ({
          select() { return this; },
          lean: async () => [{ _id: otherId }],
        }),
      },
    },
  });
  await announcementService.create({
    actor: { sub: actorId, role: 'ADMIN' },
    data: { title: 'Update', content: 'Details', audience: ['ADMIN'] },
  });
  await announcementService.publish({ actor: { sub: actorId, role: 'ADMIN' }, announcementId: entityId });
  announcementDoc.status = 'PUBLISHED';
  await announcementService.archive({ actor: { sub: actorId, role: 'ADMIN' }, announcementId: entityId });

  assert.deepEqual(entries.map(({ action }) => action), [
    'CONVERSATION_CREATED',
    'MESSAGE_CREATED',
    'COMPLAINT_SUBMITTED',
    'COMPLAINT_ASSIGNED',
    'COMPLAINT_STATUS_UPDATED',
    'LEAVE_REQUEST_SUBMITTED',
    'LEAVE_REQUEST_APPROVED',
    'LEAVE_REQUEST_REJECTED',
    'ANNOUNCEMENT_CREATED',
    'ANNOUNCEMENT_PUBLISHED',
    'ANNOUNCEMENT_ARCHIVED',
  ]);
  assert.deepEqual(entries.map(({ performedBy }) => String(performedBy)), [
    actorId,
    actorId,
    otherId,
    actorId,
    actorId,
    otherId,
    actorId,
    actorId,
    actorId,
    actorId,
    actorId,
  ]);
});

test('Group 16 business write does not commit when audit creation fails', async () => {
  let transactionAborted = false;
  let ended = false;
  const session = {
    withTransaction: async (operation) => {
      try {
        await operation();
      } catch (error) {
        transactionAborted = true;
        throw error;
      }
    },
    endSession: async () => { ended = true; },
  };
  const service = createComplaintService({
    transaction: (operation) => withAuditTransaction(operation, { startSession: async () => session }),
    models: {
      Complaint: { create: async ([data]) => [{ ...data, _id: '64b000000000000000000010' }] },
      CommunicationAudit: { create: async () => { throw new Error('database unavailable'); } },
      User: {},
    },
  });

  await assert.rejects(
    service.create({
      actor: { sub: '64b000000000000000000001', role: 'PARENT' },
      data: { category: 'General', subject: 'Issue', description: 'Details' },
    }),
    (error) => error.statusCode === 503 && error.code === 'AUDIT_WRITE_FAILED'
  );
  assert.equal(transactionAborted, true);
  assert.equal(ended, true);
});

test('Group 16 transaction passes one session to business and audit writes', async () => {
  const session = { testSession: true };
  const observedSessions = [];
  const service = createComplaintService({
    transaction: (operation) => operation(session),
    models: {
      Complaint: {
        create: async (records, options) => {
          observedSessions.push(options.session);
          return [{ ...records[0], _id: '64b000000000000000000010' }];
        },
      },
      CommunicationAudit: {
        create: async (records, options) => {
          observedSessions.push(options.session);
          return records;
        },
      },
      User: {},
    },
  });

  await service.create({
    actor: { sub: '64b000000000000000000001', role: 'PARENT' },
    data: { category: 'General', subject: 'Issue', description: 'Details' },
  });
  assert.deepEqual(observedSessions, [session, session]);
});

test('Group 16 notification is dispatched only after transaction commit', async () => {
  const events = [];
  const service = createAnnouncementService({
    transaction: async (operation) => {
      const result = await operation({ testSession: true });
      events.push('commit');
      return result;
    },
    notifications: {
      publishSafe: async () => { events.push('notification'); },
    },
    models: {
      Announcement: {
        findById: async () => ({
          _id: '64b000000000000000000010',
          status: 'DRAFT',
          audience: ['ADMIN'],
          save: async () => {},
        }),
      },
      CommunicationAudit: {
        create: async () => { events.push('audit'); return [{}]; },
      },
      User: {
        find: () => ({
          select() { return this; },
          lean: async () => [{ _id: '64b000000000000000000002' }],
        }),
      },
    },
  });

  await service.publish({
    actor: { sub: '64b000000000000000000001', role: 'ADMIN' },
    announcementId: '64b000000000000000000010',
  });
  assert.deepEqual(events, ['audit', 'commit', 'notification']);
});
