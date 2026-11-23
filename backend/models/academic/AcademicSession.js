const mongoose = require('mongoose');

const academicSessionSchema = new mongoose.Schema({
  sessionName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 80,
    unique: true,
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED'],
    required: true,
    default: 'PLANNED',
  },
  examScheduleRevision: { type: Number, required: true, default: 0, min: 0, select: false },
}, { timestamps: true });

academicSessionSchema.index(
  { status: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' } }
);
academicSessionSchema.pre('validate', function validateSessionDates() {
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    this.invalidate('endDate', 'endDate must be after startDate');
  }
});

module.exports = mongoose.models.AcademicSession
  || mongoose.model('AcademicSession', academicSessionSchema);