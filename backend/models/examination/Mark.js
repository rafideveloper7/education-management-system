const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  examScheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamSchedule',
    required: true,
    index: true,
  },
  studentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentEnrollment', required: true },
  status: { type: String, enum: ['PRESENT', 'ABSENT'], required: true },
  obtainedMarks: {
    type: Number,
    min: 0,
    default: null,
    required() { return this.status === 'PRESENT'; },
  },
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  version: { type: Number, required: true, default: 0, min: 0 },
}, { timestamps: true, strict: 'throw' });

markSchema.index({ examScheduleId: 1, studentUserId: 1 }, { unique: true });
markSchema.index({ examId: 1, studentUserId: 1 });

markSchema.pre('validate', function validateMark() {
  if (this.status === 'ABSENT' && this.obtainedMarks !== null) {
    this.invalidate('obtainedMarks', 'Absent students must not have entered marks');
  }
  if (this.status === 'PRESENT' && Number.isFinite(this.obtainedMarks)
    && !Number.isInteger(this.obtainedMarks)) {
    this.invalidate('obtainedMarks', 'obtainedMarks must be a whole number');
  }
});

module.exports = mongoose.models.Mark || mongoose.model('Mark', markSchema);
