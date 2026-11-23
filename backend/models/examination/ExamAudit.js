const mongoose = require('mongoose');

const examAuditSchema = new mongoose.Schema({
  resourceType: {
    type: String,
    enum: ['EXAM', 'SCHEDULE', 'MARK', 'GRADE_SCALE', 'RESULT'],
    required: true,
  },
  resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', default: null, index: true },
  actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: {
    type: String,
    enum: [
      'EXAM_CREATED',
      'EXAM_UPDATED',
      'EXAM_STATUS_CHANGED',
      'SCHEDULE_CREATED',
      'SCHEDULE_UPDATED',
      'MARK_ENTERED',
      'MARK_UPDATED',
      'GRADE_SCALE_CREATED',
      'GRADE_SCALE_UPDATED',
      'RESULTS_CALCULATED',
      'RESULTS_FINALIZED',
      'RESULTS_PUBLISHED',
      'RESULT_CORRECTED',
    ],
    required: true,
  },
  previousValue: { type: mongoose.Schema.Types.Mixed, default: null },
  nextValue: { type: mongoose.Schema.Types.Mixed, default: null },
  reason: { type: String, trim: true, maxlength: 500, default: null },
}, { timestamps: true, strict: 'throw' });

examAuditSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });

module.exports = mongoose.models.ExamAudit || mongoose.model('ExamAudit', examAuditSchema);
