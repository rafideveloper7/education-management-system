const PaymentReceipt = require('../../models/fee/PaymentReceipt');
const Payment = require('../../models/fee/Payment');
const FeeAudit = require('../../models/fee/FeeAudit');
const ApiError = require('../../utils/ApiError');
const { ROLES } = require('../../authorization/constants/roles.constants');

// ─── Generate receipt ─────────────────────────────────────────────────────────
// Section 16.3: Receipt is ONLY generated for a SUCCEEDED payment.
// This function is called internally by payment.service after webhook verification.
// It must NOT be exposed as a public HTTP endpoint for direct receipt creation.
//
// The session parameter supports MongoDB multi-document transactions (Section 11.4).

const generateReceipt = async ({ payment, session }) => {
  if (payment.status !== 'SUCCEEDED') {
    throw new ApiError(500, 'Receipt can only be generated for a succeeded payment');
  }

  // Section 16.3: Duplicate receipt protection — one receipt per payment.
  const existing = await PaymentReceipt.findOne({ paymentId: payment._id });
  if (existing) {
    // Idempotent — return existing receipt silently.
    return existing;
  }

  // Receipt number: RCP-{YYYYMMDD}-{random suffix}
  // Note: receipt number format is not formally approved (Section 32).
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  const receiptNumber = `RCP-${date}-${suffix}`;

  const createData = {
    receiptNumber,
    paymentId: payment._id,
    invoiceId: payment.invoiceId,
    studentUserId: payment.studentUserId,
    paidAmount: payment.amount,
    currency: payment.currency,
    paymentProvider: payment.provider,
    providerTransactionRef: payment.providerTransactionRef ?? null,
    paidAt: payment.verifiedAt ?? payment.updatedAt ?? new Date(),
    issuedAt: new Date(),
    issuedBy: 'SYSTEM',
  };

  const receipt = session
    ? await PaymentReceipt.create([createData], { session }).then((docs) => docs[0])
    : await PaymentReceipt.create(createData);

  await FeeAudit.create({
    action: 'RECEIPT_GENERATED',
    targetModel: 'PaymentReceipt',
    targetId: receipt._id,
    performedBy: payment.studentUserId,
    newState: { receiptNumber: receipt.receiptNumber, paidAmount: receipt.paidAmount },
    providerRef: payment.providerTransactionRef ?? null,
  });

  return receipt;
};

// ─── Get receipt by ID ────────────────────────────────────────────────────────

const getReceiptById = async ({ actor, receiptId }) => {
  const receipt = await PaymentReceipt.findById(receiptId).lean();
  if (!receipt) throw new ApiError(404, 'Receipt not found');

  // Ownership check — Section 18.3.
  if (actor.role !== ROLES.ADMIN) {
    if (receipt.studentUserId.toString() !== actor.sub.toString()) {
      throw new ApiError(403, 'You can only access your own receipts');
    }
  }

  return receipt;
};

// ─── List receipts for a student ─────────────────────────────────────────────

const listReceiptsForStudent = async ({ actor, studentUserId, filters = {} }) => {
  let resolvedStudentId;

  if (actor.role === ROLES.ADMIN) {
    resolvedStudentId = studentUserId;
  } else if (actor.role === ROLES.STUDENT) {
    resolvedStudentId = actor.sub;
  } else {
    throw new ApiError(403, 'You do not have permission to list receipts');
  }

  const query = { studentUserId: resolvedStudentId };
  const limit = Math.min(filters.limit ?? 50, 100);

  const items = await PaymentReceipt.find(query)
    .sort({ issuedAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = items.length > limit;
  if (hasMore) items.pop();

  return { items, pagination: { hasMore } };
};

module.exports = {
  generateReceipt,
  getReceiptById,
  listReceiptsForStudent,
};
