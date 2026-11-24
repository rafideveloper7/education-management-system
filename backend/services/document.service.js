const mongoose = require('mongoose');
const CentralDocument = require('../models/CentralDocument');
const AdmissionDocument = require('../models/admission/AdmissionDocument');
const Assignment = require('../models/assignment/Assignment');
const Submission = require('../models/assignment/Submission');
const storage = require('./assignment/cloudinary-storage.service');
const ApiError = require('../utils/ApiError');
const {
  createCommunicationAuditService,
  withAuditTransaction,
} = require('./communication/audit.service');

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const requireObjectId = (value, label) => {
  if (!OBJECT_ID_PATTERN.test(String(value || ''))) {
    throw new ApiError(400, `${label} must be a valid ObjectId`, { code: 'INVALID_OBJECT_ID' });
  }
};

const encodeCursor = (record) => Buffer.from(JSON.stringify({
  version: 1,
  createdAt: new Date(record.createdAt).toISOString(),
  id: String(record._id),
})).toString('base64url');

const decodeCursor = (cursor) => {
  try {
    const payload = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    const createdAt = new Date(payload.createdAt);
    if (payload.version !== 1 || !OBJECT_ID_PATTERN.test(payload.id)
      || Number.isNaN(createdAt.getTime())) throw new Error();
    return { createdAt, id: payload.id };
  } catch {
    throw new ApiError(400, 'cursor must be a valid document cursor', { code: 'INVALID_CURSOR' });
  }
};

const presentDocument = (record) => {
  if (!record) return record;
  const value = record.toObject ? record.toObject() : { ...record };
  const storageRef = value.storageRef
    ? { provider: value.storageRef.provider, resourceType: value.storageRef.resourceType, format: value.storageRef.format }
    : null;
  const { storageRef: _storageRef, ...safe } = value;
  return { ...safe, storageRef };
};

const createDocumentService = ({
  models = { CentralDocument, AdmissionDocument, Assignment, Submission },
  storageProvider = storage,
  transaction = withAuditTransaction,
  auditModel,
} = {}) => {
  const audit = createCommunicationAuditService({
    model: auditModel || require('../models/communication/CommunicationAudit'),
  });

  const requireAdmin = (actor) => {
    if (!actor || actor.role !== 'ADMIN') {
      throw new ApiError(403, 'Only administrators can access existing-module documents');
    }
  };

  const requireCentralAccess = (actor, document) => {
    if (!actor) throw new ApiError(401, 'Authentication required');
    if (actor.role === 'ADMIN') return;
    if (String(document.ownerId) !== String(actor.sub)) {
      throw new ApiError(404, 'Document not found');
    }
  };

  const upload = async ({ actor, ownerType, ownerId, category, title, file }) => {
    if (!actor || actor.role !== 'ADMIN') {
      throw new ApiError(403, 'Only administrators can upload central documents');
    }
    requireObjectId(ownerId, 'ownerId');
    if (!['STUDENT', 'TEACHER', 'USER'].includes(ownerType)) {
      throw new ApiError(400, 'Invalid central document owner type', { code: 'INVALID_OWNER_TYPE' });
    }
    if (!['STUDENT_DOCUMENT', 'TEACHER_DOCUMENT', 'CERTIFICATE'].includes(category)) {
      throw new ApiError(400, 'Invalid central document category', { code: 'INVALID_DOCUMENT_CATEGORY' });
    }
    if (!file) throw new ApiError(400, 'A document file is required', { code: 'FILE_REQUIRED' });

    let storedFile = null;
    try {
      storedFile = await storageProvider.upload(file, `central-document/${ownerType.toLowerCase()}`);
      return await transaction(async (session) => {
        const document = await models.CentralDocument.create([{
          ownerType,
          ownerId,
          category,
          title,
          originalName: file.originalName,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
          storageRef: {
            provider: storedFile.provider,
            publicId: storedFile.publicId,
            resourceType: storedFile.resourceType,
            format: storedFile.format,
          },
          uploadedBy: actor.sub,
          status: 'ACTIVE',
        }], { session });
        const saved = Array.isArray(document) ? document[0] : document;
        await audit.record({
          session,
          entityType: 'DOCUMENT',
          entityId: saved._id,
          action: 'DOCUMENT_UPLOADED',
          performedBy: actor.sub,
          newValue: { ownerType, ownerId, category, title, status: 'ACTIVE' },
        });
        return saved;
      });
    } catch (error) {
      if (storedFile?.publicId) {
        await storageProvider.destroy(storedFile.publicId).catch(() => {});
      }
      throw error;
    }
  };

  const list = async ({ actor, filters = {} }) => {
    if (!actor) throw new ApiError(401, 'Authentication required');
    const query = actor.role === 'ADMIN' ? {} : { ownerId: actor.sub };
    if (filters.category) query.category = filters.category;
    if (filters.status) query.status = filters.status;
    if (filters.ownerType) query.ownerType = filters.ownerType;
    if (filters.ownerId) {
      requireObjectId(filters.ownerId, 'ownerId');
      if (actor.role !== 'ADMIN') throw new ApiError(404, 'Document not found');
      query.ownerId = filters.ownerId;
    }
    if (filters.cursor) {
      const cursor = decodeCursor(filters.cursor);
      query.$or = [
        { createdAt: { $lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
      ];
    }
    const limit = filters.limit || 50;
    const records = await models.CentralDocument.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();
    const hasMore = records.length > limit;
    const items = (hasMore ? records.slice(0, limit) : records).map(presentDocument);
    return {
      items,
      pagination: {
        limit,
        hasMore,
        nextCursor: hasMore ? encodeCursor(items[items.length - 1]) : null,
      },
    };
  };

  const getById = async ({ actor, documentId }) => {
    requireObjectId(documentId, 'documentId');
    const document = await models.CentralDocument.findById(documentId).lean();
    if (!document) throw new ApiError(404, 'Document not found');
    requireCentralAccess(actor, document);
    return presentDocument(document);
  };

  const download = async ({ actor, documentId }) => {
    const document = await getById({ actor, documentId });
    const full = await models.CentralDocument.findById(documentId).lean();
    await audit.recordRead({
      entityType: 'DOCUMENT',
      entityId: full._id,
      action: 'DOCUMENT_DOWNLOADED',
      performedBy: actor.sub,
      newValue: { title: full.title, category: full.category },
    });
    const download = await storageProvider.download({
      publicId: full.storageRef.publicId,
      format: full.storageRef.format,
    });
    return {
      body: download.body,
      contentLength: download.contentLength,
      originalName: full.originalName,
      mimeType: full.mimeType,
    };
  };

  const archive = async ({ actor, documentId }) => {
    requireObjectId(documentId, 'documentId');
    const document = await models.CentralDocument.findById(documentId);
    if (!document) throw new ApiError(404, 'Document not found');
    requireCentralAccess(actor, document);
    if (document.status === 'ARCHIVED') {
      throw new ApiError(409, 'Document is already archived', { code: 'DOCUMENT_ALREADY_ARCHIVED' });
    }
    return transaction(async (session) => {
      document.status = 'ARCHIVED';
      document.archivedAt = new Date();
      await document.save({ session });
      await audit.record({
        session,
        entityType: 'DOCUMENT',
        entityId: document._id,
        action: 'DOCUMENT_ARCHIVED',
        performedBy: actor.sub,
        previousValue: { status: 'ACTIVE' },
        newValue: { status: 'ARCHIVED' },
      });
      return document;
    });
  };

  const listAdmissionDocuments = async ({ actor, filters = {} }) => {
    requireAdmin(actor);
    const query = {};
    if (filters.cursor) {
      const cursor = decodeCursor(filters.cursor);
      query.$or = [
        { createdAt: { $lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
      ];
    }
    const limit = filters.limit || 50;
    const records = await models.AdmissionDocument.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();
    const hasMore = records.length > limit;
    const items = (hasMore ? records.slice(0, limit) : records).map((record) => ({
      id: record._id,
      module: 'ADMISSION',
      admissionApplicationId: record.admissionApplicationId,
      documentType: record.documentType,
      documentName: record.documentName,
      mimeType: record.mimeType,
      fileSize: record.fileSize,
      status: record.status,
      createdAt: record.createdAt,
    }));
    return {
      items,
      pagination: {
        limit,
        hasMore,
        nextCursor: hasMore ? encodeCursor(records[limit - 1]) : null,
      },
    };
  };

  const downloadAdmissionDocument = async ({ actor, documentId }) => {
    requireAdmin(actor);
    requireObjectId(documentId, 'documentId');
    const document = await models.AdmissionDocument.findById(documentId).lean();
    if (!document) throw new ApiError(404, 'Document not found');
    await audit.recordRead({
      entityType: 'DOCUMENT',
      entityId: document._id,
      action: 'EXISTING_ADMISSION_DOCUMENT_DOWNLOADED',
      performedBy: actor.sub,
      newValue: { module: 'ADMISSION', documentType: document.documentType },
    });
    const response = await fetch(document.cloudinaryUrl || document.secureUrl, {
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok || !response.body) {
      throw new ApiError(503, 'Admission document is temporarily unavailable', {
        code: 'FILE_STORAGE_UNAVAILABLE',
      });
    }
    const { Readable } = require('stream');
    return {
      body: Readable.fromWeb(response.body),
      contentLength: response.headers.get('content-length'),
      originalName: document.documentName || 'admission-document',
      mimeType: document.mimeType,
    };
  };

  const listAssignmentDocuments = async ({ actor, filters = {} }) => {
    requireAdmin(actor);
    const limit = filters.limit || 50;
    const assignmentRecords = await models.Assignment.find({})
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean();
    const items = [];
    for (const assignment of assignmentRecords) {
      for (const file of assignment.attachments || []) {
        items.push({
          id: file._id,
          module: 'ASSIGNMENT',
          kind: 'ATTACHMENT',
          assignmentId: assignment._id,
          originalName: file.originalName,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
          createdAt: file.uploadedAt,
        });
      }
    }
    const submissionRecords = await models.Submission.find({})
      .sort({ submittedAt: -1, _id: -1 })
      .limit(limit)
      .lean();
    for (const submission of submissionRecords) {
      items.push({
        id: submission._id,
        module: 'ASSIGNMENT',
        kind: 'SUBMISSION',
        assignmentId: submission.assignmentId,
        originalName: submission.file.originalName,
        mimeType: submission.file.mimeType,
        sizeBytes: submission.file.sizeBytes,
        createdAt: submission.submittedAt,
      });
    }
    items.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
    const limited = items.slice(0, limit);
    return {
      items: limited,
      pagination: { limit, hasMore: items.length > limit, nextCursor: null },
    };
  };

  const downloadAssignmentAttachment = async ({ actor, assignmentId, fileId }) => {
    requireAdmin(actor);
    requireObjectId(assignmentId, 'assignmentId');
    requireObjectId(fileId, 'fileId');
    const assignment = await models.Assignment.findById(assignmentId).lean();
    if (!assignment) throw new ApiError(404, 'Document not found');
    const file = (assignment.attachments || []).find((item) => String(item._id) === String(fileId));
    if (!file) throw new ApiError(404, 'Document not found');
    await audit.recordRead({
      entityType: 'DOCUMENT',
      entityId: file._id,
      action: 'EXISTING_ASSIGNMENT_ATTACHMENT_DOWNLOADED',
      performedBy: actor.sub,
    });
    const download = await storageProvider.download({
      publicId: file.publicId,
      format: file.format,
    });
    return {
      body: download.body,
      contentLength: download.contentLength,
      originalName: file.originalName,
      mimeType: file.mimeType,
    };
  };

  const downloadAssignmentSubmission = async ({ actor, submissionId }) => {
    requireAdmin(actor);
    requireObjectId(submissionId, 'submissionId');
    const submission = await models.Submission.findById(submissionId).lean();
    if (!submission) throw new ApiError(404, 'Document not found');
    await audit.recordRead({
      entityType: 'DOCUMENT',
      entityId: submission._id,
      action: 'EXISTING_ASSIGNMENT_SUBMISSION_DOWNLOADED',
      performedBy: actor.sub,
    });
    const download = await storageProvider.download({
      publicId: submission.file.publicId,
      format: submission.file.format,
    });
    return {
      body: download.body,
      contentLength: download.contentLength,
      originalName: submission.file.originalName,
      mimeType: submission.file.mimeType,
    };
  };

  return {
    upload,
    list,
    getById,
    download,
    archive,
    listAdmissionDocuments,
    downloadAdmissionDocument,
    listAssignmentDocuments,
    downloadAssignmentAttachment,
    downloadAssignmentSubmission,
  };
};

module.exports = { createDocumentService, presentDocument };
