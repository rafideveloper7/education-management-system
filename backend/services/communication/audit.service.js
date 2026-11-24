const mongoose = require('mongoose');
const CommunicationAudit = require('../../models/communication/CommunicationAudit');
const ApiError = require('../../utils/ApiError');
const { sanitizeAuditValue } = require('../../utils/sanitizeAuditValue');
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const sanitizeAuditRecord = (record) => ({
  ...record,
  previousValue: sanitizeAuditValue(record.previousValue),
  newValue: sanitizeAuditValue(record.newValue),
});

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
      || Number.isNaN(createdAt.getTime())) {
      throw new Error('Invalid audit cursor');
    }
    return { createdAt, id: payload.id };
  } catch (error) {
    throw new ApiError(400, 'cursor must be a valid audit cursor', { code: 'INVALID_CURSOR' });
  }
};

const withAuditTransaction = async (operation, { startSession = () => mongoose.startSession() } = {}) => {
  const session = await startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await operation(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

const createOneInTransaction = async (model, data, session) => {
  if (!session) {
    throw new ApiError(500, 'Group 16 business writes require a transaction session', {
      code: 'AUDIT_TRANSACTION_REQUIRED',
    });
  }
  const created = await model.create([data], { session });
  return Array.isArray(created) ? created[0] : created;
};

const createCommunicationAuditService = ({ model = CommunicationAudit } = {}) => {
  const requireAdmin = (actor) => {
    if (!actor || actor.role !== 'ADMIN') {
      throw new ApiError(403, 'Audit history is restricted to administrators');
    }
  };

  const record = async ({ session, ...entry }) => {
    if (!session) {
      throw new ApiError(500, 'Audit records must be written within a business transaction', {
        code: 'AUDIT_TRANSACTION_REQUIRED',
      });
    }
    try {
      const saved = await model.create([{
        ...entry,
        previousValue: sanitizeAuditValue(entry.previousValue),
        newValue: sanitizeAuditValue(entry.newValue),
      }], { session });
      return Array.isArray(saved) ? saved[0] : saved;
    } catch {
      throw new ApiError(503, 'Audit write failed; the business action was not committed', {
        code: 'AUDIT_WRITE_FAILED',
      });
    }
  };

  const recordRead = async (entry) => {
    try {
      await model.create([{
        ...entry,
        previousValue: sanitizeAuditValue(entry.previousValue),
        newValue: sanitizeAuditValue(entry.newValue),
      }]);
    } catch {
      throw new ApiError(503, 'Document audit write failed', {
        code: 'AUDIT_WRITE_FAILED',
      });
    }
  };

  const list = async ({ actor, filters }) => {
    requireAdmin(actor);
    const query = {};
    if (filters.entityType) query.entityType = filters.entityType;
    if (filters.entityId) query.entityId = filters.entityId;
    if (filters.action) query.action = filters.action;
    if (filters.performedBy) query.performedBy = filters.performedBy;
    if (filters.from || filters.to) {
      query.createdAt = {};
      if (filters.from) query.createdAt.$gte = filters.from;
      if (filters.to) query.createdAt.$lte = filters.to;
    }
    if (filters.cursor) {
      const cursor = decodeCursor(filters.cursor);
      query.$or = [
        { createdAt: { $lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
      ];
    }

    const records = await model.find(query)
      .select('+previousValue +newValue')
      .sort({ createdAt: -1, _id: -1 })
      .limit(filters.limit + 1)
      .lean();
    const hasMore = records.length > filters.limit;
    const items = (hasMore ? records.slice(0, filters.limit) : records).map(sanitizeAuditRecord);
    return {
      items,
      pagination: {
        limit: filters.limit,
        hasMore,
        nextCursor: hasMore ? encodeCursor(items[items.length - 1]) : null,
      },
    };
  };

  const getById = async ({ actor, auditId }) => {
    requireAdmin(actor);
    const record = await model.findById(auditId)
      .select('+previousValue +newValue')
      .lean();
    if (!record) throw new ApiError(404, 'Audit record not found');
    return sanitizeAuditRecord(record);
  };

  const listByEntity = async ({ actor, entityType, entityId }) => {
    requireAdmin(actor);
    const records = await model.find({ entityType, entityId })
      .select('+previousValue +newValue')
      .sort({ createdAt: -1, _id: -1 })
      .limit(100)
      .lean();
    return records.map(sanitizeAuditRecord);
  };

  const listHistory = async ({ actor, entityType, entityId, filters }) => list({
    actor,
    filters: { ...filters, entityType, entityId },
  });

  return { record, recordRead, list, getById, listByEntity, listHistory };
};

module.exports = {
  createCommunicationAuditService,
  createOneInTransaction,
  withAuditTransaction,
};
