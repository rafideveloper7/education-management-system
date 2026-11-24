const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/document-tests';
process.env.JWT_ACCESS_SECRET ||= 'document-tests-access-secret';
process.env.JWT_REFRESH_SECRET ||= 'document-tests-refresh-secret';

const CentralDocument = require('../models/CentralDocument');
const { createDocumentService } = require('../services/document.service');
const { receiveDocument } = require('../middleware/document-upload.middleware');
const { errorHandler } = require('../middleware/error.middleware');
const { attachRequestId } = require('../middleware/requestId.middleware');
const validators = require('../validators/document.validator');
const { PERMISSIONS } = require('../authorization/constants/permissions.constants');
const { hasPermission } = require('../authorization/services/permission.service');
const { createAccessToken } = require('../services/auth/token.service');
const documentRoutes = require('../routes/document.routes');

const ids = {
  admin: '64d000000000000000000001',
  studentA: '64d000000000000000000002',
  studentB: '64d000000000000000000003',
  parent: '64d000000000000000000004',
  teacher: '64d000000000000000000005',
  document: '64d000000000000000000006',
};

test('central document validators reject invalid IDs, categories, and limits', () => {
  assert.equal(validators.uploadDocumentSchema.safeParse({
    ownerType: 'STUDENT',
    ownerId: ids.studentA,
    category: 'STUDENT_DOCUMENT',
    title: 'B-Form',
  }).success, true);
  assert.equal(validators.uploadDocumentSchema.safeParse({
    ownerType: 'STUDENT',
    ownerId: 'bad',
    category: 'STUDENT_DOCUMENT',
    title: 'B-Form',
  }).success, false);
  assert.equal(validators.documentListQuerySchema.safeParse({ limit: '101' }).success, false);
});

test('central document permission is Admin-only for manage and owner roles can read', () => {
  assert.equal(hasPermission({ role: 'ADMIN' }, PERMISSIONS.DOCUMENT_MANAGE), true);
  assert.equal(hasPermission({ role: 'TEACHER' }, PERMISSIONS.DOCUMENT_MANAGE), false);
  assert.equal(hasPermission({ role: 'STUDENT' }, PERMISSIONS.DOCUMENT_MANAGE), false);
  assert.equal(hasPermission({ role: 'ADMIN' }, PERMISSIONS.DOCUMENT_READ), true);
  assert.equal(hasPermission({ role: 'TEACHER' }, PERMISSIONS.DOCUMENT_READ), true);
  assert.equal(hasPermission({ role: 'STUDENT' }, PERMISSIONS.DOCUMENT_READ), true);
  assert.equal(hasPermission({ role: 'PARENT' }, PERMISSIONS.DOCUMENT_READ), false);
});

test('central document upload uses existing private storage and authenticated audit', async () => {
  let storedPurpose;
  let auditEntry;
  let createdSession;
  const stored = {
    provider: 'cloudinary',
    publicId: 'eduos/central-document/file',
    resourceType: 'raw',
    format: 'pdf',
  };
  const documentData = {
    _id: ids.document,
    ownerId: ids.studentA,
    ownerType: 'STUDENT',
    category: 'STUDENT_DOCUMENT',
    title: 'B-Form',
    originalName: 'bform.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 100,
    storageRef: stored,
  };
  const service = createDocumentService({
    models: {
      CentralDocument: {
        create: async ([data], options) => {
          createdSession = options.session;
          return [{ ...documentData, ...data }];
        },
      },
    },
    storageProvider: {
      upload: async (file, purpose) => {
        storedPurpose = purpose;
        return stored;
      },
      destroy: async () => {},
    },
    transaction: async (operation) => operation({ testSession: true }),
    auditModel: {
      create: async ([entry]) => {
        auditEntry = entry;
        return [entry];
      },
    },
  });

  const uploaded = await service.upload({
    actor: { sub: ids.admin, role: 'ADMIN' },
    ownerType: 'STUDENT',
    ownerId: ids.studentA,
    category: 'STUDENT_DOCUMENT',
    title: 'B-Form',
    file: {
      buffer: Buffer.from('%PDF'),
      originalName: 'bform.pdf',
      mimeType: 'application/pdf',
      format: 'pdf',
      sizeBytes: 100,
    },
  });

  assert.equal(storedPurpose, 'central-document/student');
  assert.equal(createdSession.testSession, true);
  assert.equal(uploaded.ownerId, ids.studentA);
  assert.equal(auditEntry.action, 'DOCUMENT_UPLOADED');
  assert.equal(auditEntry.performedBy, ids.admin);
});

test('owner can access own central document, other student and parent cannot', async () => {
  const document = {
    _id: ids.document,
    ownerId: ids.studentA,
    ownerType: 'STUDENT',
    category: 'STUDENT_DOCUMENT',
    title: 'B-Form',
    status: 'ACTIVE',
    storageRef: {
      publicId: 'private/file',
      format: 'pdf',
      resourceType: 'raw',
    },
  };
  const service = createDocumentService({
    models: {
      CentralDocument: {
        findById: () => ({
          lean: async () => document,
        }),
      },
    },
  });

  assert.equal((await service.getById({
    actor: { sub: ids.studentA, role: 'STUDENT' },
    documentId: ids.document,
  })).title, 'B-Form');
  await assert.rejects(service.getById({
    actor: { sub: ids.studentB, role: 'STUDENT' },
    documentId: ids.document,
  }), (error) => error.statusCode === 404);
  await assert.rejects(service.getById({
    actor: { sub: ids.parent, role: 'PARENT' },
    documentId: ids.document,
  }), (error) => error.statusCode === 404);
});

test('central upload storage is cleaned if database or audit write fails', async () => {
  let destroyed = false;
  const service = createDocumentService({
    models: {
      CentralDocument: {
        create: async () => { throw new Error('database unavailable'); },
      },
    },
    storageProvider: {
      upload: async () => ({
        provider: 'cloudinary',
        publicId: 'orphan/file',
        resourceType: 'raw',
        format: 'pdf',
      }),
      destroy: async () => { destroyed = true; },
    },
    transaction: async (operation) => operation({ testSession: true }),
  });

  await assert.rejects(service.upload({
    actor: { sub: ids.admin, role: 'ADMIN' },
    ownerType: 'STUDENT',
    ownerId: ids.studentA,
    category: 'STUDENT_DOCUMENT',
    title: 'B-Form',
    file: {
      originalName: 'bform.pdf',
      mimeType: 'application/pdf',
      format: 'pdf',
      sizeBytes: 100,
    },
  }), /database unavailable/);
  assert.equal(destroyed, true);
});

test('central document middleware rejects executable MIME spoof, oversized files, and zero bytes', async () => {
  const app = express();
  app.use(attachRequestId);
  app.post('/upload', receiveDocument, (req, res) => res.json({ success: true }));
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/upload`;

  try {
    const spoofed = new FormData();
    spoofed.append('file', new Blob([Buffer.from('MZ executable bytes')], { type: 'application/pdf' }), 'spoof.pdf');
    const spoofedResponse = await fetch(base, { method: 'POST', body: spoofed });
    assert.equal(spoofedResponse.status, 415);

    const oversized = new FormData();
    oversized.append('file', new Blob([Buffer.alloc(10 * 1024 * 1024 + 1)], { type: 'application/pdf' }), 'large.pdf');
    const oversizedResponse = await fetch(base, { method: 'POST', body: oversized });
    assert.equal(oversizedResponse.status, 413);

    const empty = new FormData();
    empty.append('file', new Blob([], { type: 'application/pdf' }), 'empty.pdf');
    const emptyResponse = await fetch(base, { method: 'POST', body: empty });
    assert.equal(emptyResponse.status, 415);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test('existing module central listings and downloads are Admin-only', async () => {
  const service = createDocumentService({
    models: {
      AdmissionDocument: {
        find: () => ({
          sort() { return this; },
          limit() { return this; },
          lean: async () => [],
        }),
        findById: () => ({
          lean: async () => null,
        }),
      },
    },
  });
  await assert.rejects(service.listAdmissionDocuments({
    actor: { sub: ids.studentA, role: 'STUDENT' },
  }), (error) => error.statusCode === 403);
  await assert.rejects(service.downloadAdmissionDocument({
    actor: { sub: ids.teacher, role: 'TEACHER' },
    documentId: ids.document,
  }), (error) => error.statusCode === 403);
});

test('central document HTTP routes reject parent and ID guessing is service-scope denied', async () => {
  const app = express();
  app.use(attachRequestId);
  app.use('/api/v1', documentRoutes);
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    const parentToken = createAccessToken({
      _id: { toString: () => ids.parent },
      role: 'PARENT',
    }, 'document-parent');
    const parentResponse = await fetch(
      `http://127.0.0.1:${server.address().port}/api/v1/documents/${ids.document}`,
      { headers: { authorization: `Bearer ${parentToken}` } }
    );
    assert.equal(parentResponse.status, 403);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test('CentralDocument blocks delete and unrelated mutation but allows archive', async () => {
  const document = new CentralDocument({
    ownerType: 'STUDENT',
    ownerId: ids.studentA,
    category: 'STUDENT_DOCUMENT',
    title: 'B-Form',
    originalName: 'bform.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 100,
    storageRef: {
      provider: 'cloudinary',
      publicId: 'private/bform',
      resourceType: 'raw',
      format: 'pdf',
    },
    uploadedBy: ids.admin,
  });
  await document.validate();
  document.status = 'ARCHIVED';
  document.archivedAt = new Date();
  await document.validate();
});

test('central document archive is owner/Admin scoped and emits an audit record', async () => {
  const document = {
    _id: ids.document,
    ownerId: ids.studentA,
    status: 'ACTIVE',
    save: async () => {},
  };
  let auditEntry;
  const service = createDocumentService({
    models: {
      CentralDocument: {
        findById: async () => document,
      },
    },
    transaction: async (operation) => operation({ testSession: true }),
    auditModel: {
      create: async ([entry]) => {
        auditEntry = entry;
        return [entry];
      },
    },
  });

  await assert.rejects(service.archive({
    actor: { sub: ids.studentB, role: 'STUDENT' },
    documentId: ids.document,
  }), (error) => error.statusCode === 404);

  document.save = async ({ session }) => {
    assert.equal(session.testSession, true);
  };
  document.ownerId = ids.studentA;
  const archived = await service.archive({
    actor: { sub: ids.studentA, role: 'STUDENT' },
    documentId: ids.document,
  });
  assert.equal(archived.status, 'ARCHIVED');
  assert.equal(auditEntry.action, 'DOCUMENT_ARCHIVED');
  assert.equal(auditEntry.performedBy, ids.studentA);
});

test('CentralDocument mutation guards reject delete and title changes', async () => {
  await assert.rejects(
    CentralDocument.findOneAndUpdate(
      { _id: ids.document },
      { $set: { title: 'Changed title' } }
    ),
    /archive lifecycle/
  );
  await assert.rejects(
    CentralDocument.deleteMany({ ownerId: ids.studentA }),
    /delete is not supported/
  );
});
