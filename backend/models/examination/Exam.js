const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
  examType: { type: String, required: true, trim: true, maxlength: 60 },
  academicSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession',
    required: true,
    index: true,
  },
  startDate: { type: Date, required: true, index: true },
  endDate: { type: Date, required: true, index: true },
  status: {
    type: String,
    enum: ['DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'RESULTS_READY'],
    required: true,
    default: 'DRAFT',
    index: true,
  },
  workflowRevision: { type: Number, required: true, default: 0, min: 0, select: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, strict: 'throw' });

examSchema.index({ academicSessionId: 1, status: 1, createdAt: -1, _id: -1 });

examSchema.pre('validate', function validateExamDates() {
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    this.invalidate('endDate', 'endDate must be on or after startDate');
  }
});

module.exports = mongoose.models.Exam || mongoose.model('Exam', examSchema);
