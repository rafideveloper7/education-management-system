const mongoose = require('mongoose');
const StudentFeeAssignment = require('../../models/fee/StudentFeeAssignment');
const FeeStructure = require('../../models/fee/FeeStructure');
const Invoice = require('../../models/fee/Invoice');
const Payment = require('../../models/fee/Payment');
const FeeDiscount = require('../../models/fee/FeeDiscount');
const FeeAudit = require('../../models/fee/FeeAudit');
const ApiError = require('../../utils/ApiError');
const { ROLES } = require('../../authorization/constants/roles.constants');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const assertAdmin = (user) => {
  if (user.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Only administrators can manage fee assignments');
  }
};

// Generate a sequential invoice number.
// Format: INV-{YYYYMMDD}-{counter padded to 6 digits}
// Note: invoice number format is not formally defined in requirements (Section 32).
// Using a date + random suffix to ensure uniqueness without a separate counter collection.
// If institute requires a specific format, this function should be updated per policy.
const generateInvoiceNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `INV-${date}-${suffix}`;
};

// ─── Assign fee to student ────────────────────────────────────────────────────

const assignFeeToStudent = async ({ actor, payload }) => {
  assertAdmin(actor);

  const structure = await FeeStructure.findById(payload.feeStructureId);
  if (!structure) throw new ApiError(404, 'Fee structure not found');
  if (!structure.isActive) throw new ApiError(400, 'Cannot assign an inactive fee structure');

  // Snapshot the amount from the structure at assignment time.
  const assignment = await StudentFeeAssignment.create({
    studentUserId: payload.studentUserId,
    feeStructureId: payload.feeStructureId,
    academicSessionId: payload.academicSessionId ?? structure.academicSessionId,
    assignedAmount: structure.amount,
    currency: structure.currency,
    dueDate: payload.dueDate,
    status: 'ACTIVE',
    assignedBy: actor.sub,
  });

  await FeeAudit.create({
    action: 'FEE_ASSIGNED',
    targetModel: 'StudentFeeAssignment',
    targetId: assignment._id,
    performedBy: actor.sub,
    newState: { studentUserId: assignment.studentUserId, assignedAmount: assignment.assignedAmount },
  });

  return assignment;
};

// ─── List assignments for a student ──────────────────────────────────────────

const listStudentFeeAssignments = async ({ actor, studentUserId, filters = {} }) => {
  // Admin can see any student. Student can only see their own.
  const resolvedStudentId = actor.role === ROLES.ADMIN
    ? studentUserId
    : actor.sub;

  if (actor.role === ROLES.STUDENT && actor.sub.toString() !== resolvedStudentId.toString()) {
    throw new ApiError(403, 'You can only view your own fee assignments');
  }

  const query = { studentUserId: resolvedStudentId };
  if (filters.academicSessionId) query.academicSessionId = filters.academicSessionId;
  if (filters.status) query.status = filters.status;

  return StudentFeeAssignment.find(query).sort({ createdAt: -1 }).lean();
};

// ─── Calculate outstanding balance for an invoice ────────────────────────────
// This is a pure calculation helper used by invoice.service and payment.service.
// It does NOT write anything to the database.
const calculateOutstandingBalance = async (invoiceId) => {
  const invoice = await Invoice.findById(invoiceId).lean();
  if (!invoice) throw new ApiError(404, 'Invoice not found');

  // Sum all SUCCEEDED payments applied to this invoice.
  const paymentsAgg = await Payment.aggregate([
    { $match: { invoiceId: new mongoose.Types.ObjectId(invoiceId), status: 'SUCCEEDED' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const totalPaid = paymentsAgg[0]?.total ?? 0;

  // Sum all ACTIVE discounts applied to this invoice.
  const discountsAgg = await FeeDiscount.aggregate([
    { $match: { invoiceId: new mongoose.Types.ObjectId(invoiceId), status: 'ACTIVE' } },
    { $group: { _id: null, total: { $sum: '$discountAmount' } } },
  ]);
  const totalDiscount = discountsAgg[0]?.total ?? 0;

  const outstanding = Math.max(0, invoice.payableAmount - totalPaid - totalDiscount);

  return {
    invoiceId: invoice._id,
    payableAmount: invoice.payableAmount,
    totalPaid,
    totalDiscount,
    outstanding,
    currency: invoice.currency,
  };
};

// ─── Apply discount to an invoice ────────────────────────────────────────────

const applyDiscount = async ({ actor, payload }) => {
  assertAdmin(actor);

  const invoice = await Invoice.findById(payload.invoiceId);
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  if (invoice.status === 'PAID') throw new ApiError(400, 'Cannot apply a discount to a fully paid invoice');
  if (invoice.status === 'CANCELLED') throw new ApiError(400, 'Cannot apply a discount to a cancelled invoice');

  const balance = await calculateOutstandingBalance(payload.invoiceId);
  if (payload.discountAmount > balance.outstanding) {
    throw new ApiError(400, `Discount amount (${payload.discountAmount}) exceeds outstanding balance (${balance.outstanding})`);
  }

  const discount = await FeeDiscount.create({
    invoiceId: payload.invoiceId,
    studentUserId: invoice.studentUserId,
    discountType: payload.discountType,
    discountAmount: payload.discountAmount,
    currency: invoice.currency,
    reason: payload.reason,
    status: 'ACTIVE',
    createdBy: actor.sub,
  });

  await FeeAudit.create({
    action: 'DISCOUNT_APPLIED',
    targetModel: 'FeeDiscount',
    targetId: discount._id,
    performedBy: actor.sub,
    newState: { discountAmount: discount.discountAmount, discountType: discount.discountType },
    reason: payload.reason,
  });

  return discount;
};

module.exports = {
  assignFeeToStudent,
  listStudentFeeAssignments,
  calculateOutstandingBalance,
  applyDiscount,
  generateInvoiceNumber,
};
