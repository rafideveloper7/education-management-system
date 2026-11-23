const mongoose = require('mongoose');

// FeeDiscount records an approved fee reduction for a specific student + invoice.
//
// Section 14.3: Discount is NOT a payment and NOT a refund.
// It reduces the payable amount on an invoice based on an approved institutional decision.
//
// Section 14.2: Discount creation requires explicit permission (DISCOUNT_CREATE).
// Reason and audit trail are preserved. Historical records are NOT overwritten.
const feeDiscountSchema = new mongoose.Schema({
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
  discountType: {
    type: String,
    enum: ['SCHOLARSHIP', 'SIBLING', 'MERIT', 'FINANCIAL_AID', 'OTHER'],
    required: true,
  },
  // Absolute discount amount (not percentage — avoids rounding policy decisions).
  // If percentage-based discounts are needed later, the calculation logic will
  // convert to absolute before storing, per approved accounting policy.
  discountAmount: {
    type: Number,
    required: true,
    min: 0.01,
    validate: {
      validator: Number.isFinite,
      message: 'Discount amount must be a finite number',
    },
  },
  currency: { type: String, required: true, trim: true, uppercase: true, default: 'PKR', maxlength: 3 },
  reason: { type: String, required: true, trim: true, minlength: 3, maxlength: 500 },
  status: {
    type: String,
    enum: ['ACTIVE', 'REVERSED'],
    required: true,
    default: 'ACTIVE',
    index: true,
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, strict: 'throw' });

feeDiscountSchema.index({ invoiceId: 1, status: 1 });

module.exports = mongoose.models.FeeDiscount || mongoose.model('FeeDiscount', feeDiscountSchema);
