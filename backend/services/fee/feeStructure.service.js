const FeeStructure = require('../../models/fee/FeeStructure');
const FeeAudit = require('../../models/fee/FeeAudit');
const Invoice = require('../../models/fee/Invoice');
const ApiError = require('../../utils/ApiError');
const { ROLES } = require('../../authorization/constants/roles.constants');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const assertAdminOrFeeManage = (user) => {
  if (user.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'You do not have permission to manage fee structures');
  }
};

const findStructureOrThrow = async (structureId) => {
  const structure = await FeeStructure.findById(structureId);
  if (!structure) {
    throw new ApiError(404, 'Fee structure not found');
  }
  return structure;
};

// ─── Create ───────────────────────────────────────────────────────────────────

const createFeeStructure = async ({ actor, payload }) => {
  assertAdminOrFeeManage(actor);

  const structure = await FeeStructure.create({
    name: payload.name,
    description: payload.description ?? '',
    category: payload.category,
    amount: payload.amount,
    currency: payload.currency ?? 'PKR',
    academicSessionId: payload.academicSessionId,
    isActive: true,
    createdBy: actor.sub,
  });

  await FeeAudit.create({
    action: 'FEE_STRUCTURE_CREATED',
    targetModel: 'FeeStructure',
    targetId: structure._id,
    performedBy: actor.sub,
    newState: { name: structure.name, amount: structure.amount, category: structure.category },
  });

  return structure;
};

// ─── List ─────────────────────────────────────────────────────────────────────

const listFeeStructures = async ({ actor, filters = {} }) => {
  // Admin sees all; students/parents see only active structures.
  const query = {};
  if (filters.academicSessionId) query.academicSessionId = filters.academicSessionId;
  if (actor.role !== ROLES.ADMIN) {
    query.isActive = true;
  } else if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }

  const limit = Math.min(filters.limit ?? 50, 100);
  const buildCursor = (doc) => Buffer.from(doc._id.toString()).toString('base64url');

  let cursorCondition = {};
  if (filters.cursor) {
    const decodedId = Buffer.from(filters.cursor, 'base64url').toString('utf8');
    cursorCondition = { _id: { $lt: decodedId } };
  }

  const items = await FeeStructure.find({ ...query, ...cursorCondition })
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = items.length > limit;
  if (hasMore) items.pop();

  return {
    items,
    pagination: {
      hasMore,
      nextCursor: hasMore ? buildCursor(items[items.length - 1]) : null,
    },
  };
};

// ─── Get by ID ────────────────────────────────────────────────────────────────

const getFeeStructureById = async ({ actor, structureId }) => {
  const structure = await findStructureOrThrow(structureId);

  // Students and parents only see active structures.
  if (actor.role !== ROLES.ADMIN && !structure.isActive) {
    throw new ApiError(404, 'Fee structure not found');
  }

  return structure;
};

// ─── Update ───────────────────────────────────────────────────────────────────

const updateFeeStructure = async ({ actor, structureId, payload }) => {
  assertAdminOrFeeManage(actor);

  const structure = await findStructureOrThrow(structureId);
  const previousState = {
    name: structure.name,
    amount: structure.amount,
    category: structure.category,
    isActive: structure.isActive,
  };

  // Section 6.3: If invoices already exist for this structure, we allow
  // the update on the structure itself, but existing invoices are NOT
  // affected — they were snapshotted at generation time.
  // We log a warning in the audit if invoices exist.
  const invoiceCount = await Invoice.countDocuments({ studentFeeAssignmentId: { $exists: true } });
  const hasInvoices = invoiceCount > 0;

  if (payload.name !== undefined) structure.name = payload.name;
  if (payload.description !== undefined) structure.description = payload.description;
  if (payload.category !== undefined) structure.category = payload.category;
  if (payload.amount !== undefined) structure.amount = payload.amount;
  if (payload.isActive !== undefined) structure.isActive = payload.isActive;

  await structure.save();

  await FeeAudit.create({
    action: 'FEE_STRUCTURE_UPDATED',
    targetModel: 'FeeStructure',
    targetId: structure._id,
    performedBy: actor.sub,
    previousState,
    newState: { name: structure.name, amount: structure.amount, isActive: structure.isActive },
    reason: payload.reason ?? null,
    metadata: hasInvoices ? { note: 'Structure updated while invoices exist. Existing invoices are unaffected.' } : null,
  });

  return structure;
};

module.exports = {
  createFeeStructure,
  listFeeStructures,
  getFeeStructureById,
  updateFeeStructure,
};
