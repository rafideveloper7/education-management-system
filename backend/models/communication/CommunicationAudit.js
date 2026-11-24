const mongoose = require('mongoose');
const { sanitizeAuditValue } = require('../../utils/sanitizeAuditValue');

const communicationAuditSchema = new mongoose.Schema({
  entityType: { type: String, enum: ['MESSAGE', 'CONVERSATION', 'COMPLAINT', 'LEAVE_REQUEST', 'ANNOUNCEMENT', 'DOCUMENT', 'TIMETABLE'], required: true, index: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  action: { type: String, required: true, trim: true, maxlength: 100, index: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  previousValue: { type: mongoose.Schema.Types.Mixed, default: null, select: false },
  newValue: { type: mongoose.Schema.Types.Mixed, default: null, select: false },
  requestId: { type: String, trim: true, maxlength: 100, default: null },
}, { timestamps: true, strict: 'throw' });

communicationAuditSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
communicationAuditSchema.index({ createdAt: -1 });

communicationAuditSchema.pre('validate', function sanitizeSensitiveSnapshots() {
  this.previousValue = sanitizeAuditValue(this.previousValue);
  this.newValue = sanitizeAuditValue(this.newValue);
});

communicationAuditSchema.pre('save', function preventAuditOverwrite() {
  if (!this.isNew) throw new Error('Audit records are immutable');
});

communicationAuditSchema.pre([
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'findOneAndReplace',
  'replaceOne',
  'deleteOne',
  'deleteMany',
  'findOneAndDelete',
  'findOneAndRemove',
], function preventAuditMutation() {
  throw new Error('Audit records are immutable');
});

communicationAuditSchema.pre('bulkWrite', function preventBulkAuditMutation(operations) {
  if (operations.some((operation) => !operation.insertOne)) {
    throw new Error('Audit records are immutable');
  }
});

communicationAuditSchema.pre('deleteOne', { document: true, query: false }, function preventDocumentDelete() {
  throw new Error('Audit records are immutable');
});

module.exports = mongoose.models.CommunicationAudit || mongoose.model('CommunicationAudit', communicationAuditSchema);
