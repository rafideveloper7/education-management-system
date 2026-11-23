const mongoose = require('mongoose');

// FeeStructure defines a reusable fee category and amount for the institute.
// Example: "Tuition Fee - 2025", amount: 15000, applicable to all students.
//
// Important rule (Section 6.3): updating a FeeStructure must NOT silently
// change existing invoices. Invoices snapshot the amount at the time of
// generation and are independent of later structure changes.
const feeStructureSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  category: { type: String, required: true, trim: true, maxlength: 60 },
  amount: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isFinite,
      message: 'Amount must be a finite number',
    },
  },
  currency: { type: String, required: true, trim: true, uppercase: true, default: 'PKR', maxlength: 3 },
  academicSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession',
    required: true,
    index: true,
  },
  isActive: { type: Boolean, required: true, default: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, strict: 'throw' });

feeStructureSchema.index({ academicSessionId: 1, isActive: 1, category: 1 });

module.exports = mongoose.models.FeeStructure || mongoose.model('FeeStructure', feeStructureSchema);
