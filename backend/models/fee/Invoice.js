const mongoose = require('mongoose');

// Invoice represents the payable record for a student.
// It is separate from Payment — one invoice can have multiple payments (partial).
//
// Section 8.2: Invoice amount is snapshotted. It must NOT change when
// FeeStructure or StudentFeeAssignment changes later.
//
// Section 8.4: Outstanding balance is calculated as:
//   payableAmount - totalVerifiedPayments - totalDiscounts
// This calculation happens in the service layer, not stored here,
// to keep the source of truth in actual payment records.
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true,
    maxlength: 50,
  },
  studentUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  studentFeeAssignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentFeeAssignment',
    required: true,
    index: true,
  },
  academicSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession',
    required: true,
    index: true,
  },
  // Payable amount snapshotted at invoice generation time.
  payableAmount: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isFinite,
      message: 'Payable amount must be a finite number',
    },
  },
  currency: { type: String, required: true, trim: true, uppercase: true, default: 'PKR', maxlength: 3 },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    // Section 9.5: Invoice status is separate from payment status.
    enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'],
    required: true,
    default: 'UNPAID',
    index: true,
  },
  issuedAt: { type: Date, required: true, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, strict: 'throw' });

invoiceSchema.index({ studentUserId: 1, status: 1, dueDate: 1 });
invoiceSchema.index({ academicSessionId: 1, status: 1 });

module.exports = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
