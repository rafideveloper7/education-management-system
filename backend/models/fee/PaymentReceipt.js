const mongoose = require('mongoose');

// PaymentReceipt is issued ONLY for a SUCCEEDED payment.
//
// Section 16.3: Receipt must NEVER be issued for a PENDING or FAILED payment.
// Receipt number uniqueness is enforced by the unique index.
// Duplicate webhook protection: one receipt per payment (unique paymentId index).
const paymentReceiptSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true,
    maxlength: 60,
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
    unique: true, // One receipt per payment — prevents duplicate receipt from duplicate webhook.
    index: true,
  },
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
  // Snapshotted from the payment at receipt generation time.
  paidAmount: {
    type: Number,
    required: true,
    min: 0.01,
    validate: {
      validator: Number.isFinite,
      message: 'Paid amount must be a finite number',
    },
  },
  currency: { type: String, required: true, trim: true, uppercase: true, default: 'PKR', maxlength: 3 },
  paymentProvider: { type: String, required: true, trim: true, maxlength: 60 },
  providerTransactionRef: { type: String, trim: true, maxlength: 200, default: null },
  paidAt: { type: Date, required: true },
  issuedAt: { type: Date, required: true, default: Date.now },
  issuedBy: { type: String, required: true, default: 'SYSTEM', maxlength: 60 },
}, { timestamps: true, strict: 'throw' });

module.exports = mongoose.models.PaymentReceipt
  || mongoose.model('PaymentReceipt', paymentReceiptSchema);
