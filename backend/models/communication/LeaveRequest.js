const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true, trim: true, maxlength: 50 },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  startDate: { type: Date, required: true, index: true },
  endDate: { type: Date, required: true, index: true },
  reason: { type: String, required: true, trim: true, maxlength: 5000 },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], required: true, default: 'PENDING', index: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewNote: { type: String, trim: true, maxlength: 5000, default: null },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true, strict: 'throw' });

leaveRequestSchema.index({ requestedBy: 1, createdAt: -1 });
leaveRequestSchema.index({ studentId: 1, status: 1, startDate: 1 });

leaveRequestSchema.pre('validate', function validateDates() {
  if (this.endDate && this.startDate && this.endDate < this.startDate) {
    this.invalidate('endDate', 'endDate must be on or after startDate');
  }
});

module.exports = mongoose.models.LeaveRequest || mongoose.model('LeaveRequest', leaveRequestSchema);
