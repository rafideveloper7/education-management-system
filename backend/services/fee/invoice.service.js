const Invoice = require('../../models/fee/Invoice');
const StudentFeeAssignment = require('../../models/fee/StudentFeeAssignment');
const FeeAudit = require('../../models/fee/FeeAudit');
const ApiError = require('../../utils/ApiError');
const { ROLES } = require('../../authorization/constants/roles.constants');
const { calculateOutstandingBalance, generateInvoiceNumber } = require('./studentFee.service');

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Verify the requesting user can access this invoice.
// Section 18.3: Ownership check — authenticated user != access to all invoices.
const assertInvoiceAccess = (actor, invoice) => {
  if (actor.role === ROLES.ADMIN) return;

  if (actor.role === ROLES.STUDENT) {
    if (invoice.studentUserId.toString() !== actor.sub.toString()) {
      throw new ApiError(403, 'You can only access your own invoices');
    }
    return;
  }

  // Parent access is verified by the caller (requires ParentStudent relationship check).
  // We trust the controller has called verifyParentChildRelationship before reaching here.
  throw new ApiError(403, 'You do not have permission to access this invoice');
};

// ─── Generate invoice ─────────────────────────────────────────────────────────

const generateInvoice = async ({ actor, payload }) => {
  if (actor.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Only administrators can generate invoices');
  }

  const assignment = await StudentFeeAssignment.findById(payload.studentFeeAssignmentId);
  if (!assignment) throw new ApiError(404, 'Fee assignment not found');
  if (assignment.status === 'CANCELLED') throw new ApiError(400, 'Cannot generate invoice for a cancelled fee assignment');

  // One active invoice per assignment — prevent duplicate invoice generation.
  const existing = await Invoice.findOne({
    studentFeeAssignmentId: payload.studentFeeAssignmentId,
    status: { $nin: ['CANCELLED'] },
  });
  if (existing) {
    throw new ApiError(409, 'An active invoice already exists for this fee assignment', {
      code: 'INVOICE_ALREADY_EXISTS',
    });
  }

  // Invoice amount is snapshotted from assignment (not recalculated from FeeStructure).
  const invoice = await Invoice.create({
    invoiceNumber: generateInvoiceNumber(),
    studentUserId: assignment.studentUserId,
    studentFeeAssignmentId: assignment._id,
    academicSessionId: assignment.academicSessionId,
    payableAmount: assignment.assignedAmount,
    currency: assignment.currency,
    dueDate: payload.dueDate ?? assignment.dueDate,
    status: 'UNPAID',
    issuedAt: new Date(),
    createdBy: actor.sub,
  });

  await FeeAudit.create({
    action: 'INVOICE_GENERATED',
    targetModel: 'Invoice',
    targetId: invoice._id,
    performedBy: actor.sub,
    newState: { invoiceNumber: invoice.invoiceNumber, payableAmount: invoice.payableAmount, studentUserId: invoice.studentUserId },
  });

  return invoice;
};

// ─── List invoices ────────────────────────────────────────────────────────────

const listInvoices = async ({ actor, filters = {}, studentUserId }) => {
  const query = {};

  if (actor.role === ROLES.ADMIN) {
    // Admin can filter by any student, or list all.
    if (studentUserId) query.studentUserId = studentUserId;
    if (filters.status) query.status = filters.status;
    if (filters.academicSessionId) query.academicSessionId = filters.academicSessionId;
  } else if (actor.role === ROLES.STUDENT) {
    // Student sees only their own invoices.
    query.studentUserId = actor.sub;
    if (filters.status) query.status = filters.status;
  } else {
    throw new ApiError(403, 'You do not have permission to list invoices');
  }

  const limit = Math.min(filters.limit ?? 50, 100);
  let cursorCondition = {};
  if (filters.cursor) {
    const decodedId = Buffer.from(filters.cursor, 'base64url').toString('utf8');
    cursorCondition = { _id: { $lt: decodedId } };
  }

  const items = await Invoice.find({ ...query, ...cursorCondition })
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = items.length > limit;
  if (hasMore) items.pop();

  return {
    items,
    pagination: {
      hasMore,
      nextCursor: hasMore
        ? Buffer.from(items[items.length - 1]._id.toString()).toString('base64url')
        : null,
    },
  };
};

// ─── Get invoice by ID (with outstanding balance) ────────────────────────────

const getInvoiceById = async ({ actor, invoiceId }) => {
  const invoice = await Invoice.findById(invoiceId).lean();
  if (!invoice) throw new ApiError(404, 'Invoice not found');

  assertInvoiceAccess(actor, invoice);

  const balance = await calculateOutstandingBalance(invoiceId);

  return { ...invoice, ...balance };
};

// ─── Update invoice status ────────────────────────────────────────────────────
// This is called internally by payment.service after verifying a payment.
// Direct status mutation from outside is not allowed.

const updateInvoiceStatusInternal = async ({ invoiceId, session }) => {
  // Recalculate balance using current DB state (within the provided session if any).
  const balance = await calculateOutstandingBalance(invoiceId);

  let newStatus;
  if (balance.outstanding <= 0) {
    newStatus = 'PAID';
  } else if (balance.totalPaid > 0) {
    newStatus = 'PARTIALLY_PAID';
  } else {
    newStatus = 'UNPAID';
  }

  const updateQuery = Invoice.findByIdAndUpdate(
    invoiceId,
    { status: newStatus },
    { new: true },
  );
  if (session) updateQuery.session(session);

  const updated = await updateQuery.lean();
  return { invoice: updated, balance };
};

module.exports = {
  generateInvoice,
  listInvoices,
  getInvoiceById,
  updateInvoiceStatusInternal,
};
