const mongoose = require('mongoose');
const Invoice = require('../../models/fee/Invoice');
const Payment = require('../../models/fee/Payment');
const FeeDiscount = require('../../models/fee/FeeDiscount');
const ApiError = require('../../utils/ApiError');
const { ROLES } = require('../../authorization/constants/roles.constants');

// ─── Outstanding fees summary ─────────────────────────────────────────────────
// Section 17.1: Shows unpaid/partially paid/overdue invoices for authorized users.

const getOutstandingFeesSummary = async ({ actor, filters = {} }) => {
  if (actor.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Only administrators can view outstanding fees summary');
  }

  const matchQuery = { status: { $in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] } };
  if (filters.academicSessionId) {
    matchQuery.academicSessionId = new mongoose.Types.ObjectId(filters.academicSessionId);
  }
  if (filters.studentUserId) {
    matchQuery.studentUserId = new mongoose.Types.ObjectId(filters.studentUserId);
  }

  const limit = Math.min(filters.limit ?? 50, 100);
  const invoices = await Invoice.find(matchQuery)
    .sort({ dueDate: 1 })
    .limit(limit)
    .lean();

  return { items: invoices, count: invoices.length };
};

// ─── Financial summary report ─────────────────────────────────────────────────
// Section 17.2: Totals for invoiced, collected, outstanding amounts.
// Section 17.3: Only SUCCEEDED payments count as collected revenue.

const getFinancialSummary = async ({ actor, filters = {} }) => {
  if (actor.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Only administrators can view financial reports');
  }

  const invoiceMatch = {};
  const paymentMatch = {};

  if (filters.academicSessionId) {
    invoiceMatch.academicSessionId = new mongoose.Types.ObjectId(filters.academicSessionId);
    paymentMatch.invoiceId = { $in: await Invoice.find({ academicSessionId: filters.academicSessionId }).distinct('_id') };
  }

  // Section 17.3: Date range on payment, not initiation.
  if (filters.fromDate || filters.toDate) {
    paymentMatch.verifiedAt = {};
    if (filters.fromDate) paymentMatch.verifiedAt.$gte = new Date(filters.fromDate);
    if (filters.toDate) paymentMatch.verifiedAt.$lte = new Date(filters.toDate);
  }

  const [invoiceTotals, paymentTotals, refundTotals, discountTotals] = await Promise.all([
    Invoice.aggregate([
      { $match: invoiceMatch },
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$payableAmount' } } },
    ]),
    Payment.aggregate([
      { $match: { ...paymentMatch, status: 'SUCCEEDED' } },
      { $group: { _id: '$provider', count: { $sum: 1 }, total: { $sum: '$amount' } } },
    ]),
    // Section 17.3: Pending/failed payments are NOT counted as revenue.
    Payment.aggregate([
      { $match: { ...paymentMatch, status: { $in: ['PENDING', 'FAILED'] } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    FeeDiscount.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: '$discountType', total: { $sum: '$discountAmount' }, count: { $sum: 1 } } },
    ]),
  ]);

  return {
    invoiceBreakdown: invoiceTotals,
    collectedByProvider: paymentTotals,
    pendingAndFailedCounts: refundTotals,
    discountBreakdown: discountTotals,
    generatedAt: new Date(),
  };
};

module.exports = {
  getOutstandingFeesSummary,
  getFinancialSummary,
};
