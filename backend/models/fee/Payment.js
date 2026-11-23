const mongoose = require('mongoose');

// Payment records a single financial transaction attempt against an invoice.
//
// Section 9.1-9.4: Payment lifecycle is:
//   PENDING → SUCCEEDED | FAILED | CANCELLED
//
// PENDING is the state immediately after initiation — before provider confirms.
// SUCCEEDED means provider verification is complete (Section 11.2).
// A payment must NEVER be marked SUCCEEDED without provider-verified confirmation.
//
// Section 12: idempotencyKey prevents duplicate payment creation from retries.
// Scope: userId + invoiceId + provider + client-supplied key.
const paymentSchema = new mongoose.Schema({
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
    index: true,
  },
  studentUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // Amount the student is attempting to pay (validated against outstanding balance server-side).
  amount: {
    type: Number,
    required: true,
    min: 0.01,
    validate: {
      validator: Number.isFinite,
      message: 'Payment amount must be a finite number',
    },
  },
  currency: { type: String, required: true, trim: true, uppercase: true, default: 'PKR', maxlength: 3 },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED'],
    required: true,
    default: 'PENDING',
    index: true,
  },
  provider: {
    type: String,
    required: true,
    trim: true,
    enum: ['EASYPAISA', 'MANUAL'],
    index: true,
  },
  // Provider's unique transaction reference. Set after provider responds.
  providerTransactionRef: {
    type: String,
    trim: true,
    default: null,
    maxlength: 200,
  },
  // Raw provider status string for reconciliation and debugging.
  providerStatus: { type: String, trim: true, default: null, maxlength: 100 },
  // Provider webhook/verification metadata stored for audit.
  providerMetadata: { type: mongoose.Schema.Types.Mixed, default: null, select: false },
  // Section 12: idempotency key to prevent duplicate payment initiation.
  idempotencyKey: {
    type: String,
    required: true,
    trim: true,
    maxlength: 256,
    index: true,
  },
  // Marks reconciliation-needed cases (Section 4.6, 24).
  requiresReconciliation: { type: Boolean, default: false, index: true },
  reconciliationNote: { type: String, trim: true, maxlength: 500, default: null },
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  verifiedAt: { type: Date, default: null },
}, { timestamps: true, strict: 'throw' });

// Unique idempotency key per user + invoice + provider to prevent duplicate payments.
paymentSchema.index(
  { studentUserId: 1, invoiceId: 1, idempotencyKey: 1 },
  { unique: true },
);

// Provider transaction reference should be unique per provider to detect duplicate webhooks.
// sparse: true because providerTransactionRef is null until provider confirms.
paymentSchema.index(
  { provider: 1, providerTransactionRef: 1 },
  { unique: true, sparse: true },
);

paymentSchema.index({ invoiceId: 1, status: 1 });

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
