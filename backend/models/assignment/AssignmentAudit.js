const mongoose = require('mongoose');

const assignmentAuditSchema = new mongoose.Schema({
  resourceType: { type: String, enum: ['ASSIGNMENT', 'UPLOAD_POLICY'], required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['DEADLINE_EXTENDED', 'UPLOAD_LIMITS_CHANGED'], required: true },
  previousValue: { type: mongoose.Schema.Types.Mixed, required: true },
  nextValue: { type: mongoose.Schema.Types.Mixed, required: true },
  reason: { type: String, trim: true, maxlength: 500, default: null },
}, { timestamps: true, strict: 'throw' });

assignmentAuditSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });

module.exports = mongoose.models.AssignmentAudit
  || mongoose.model('AssignmentAudit', assignmentAuditSchema);