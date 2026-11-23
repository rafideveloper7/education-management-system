const mongoose = require('mongoose');

// FeeAudit stores the audit trail for significant financial operations.
//
// Section 20: Every important financial action should record who did what,
// on which record, and when. Passwords, secrets, and raw credentials
// must NEVER be stored here.
//
// Not every read operation creates an audit record — only writes and
// state changes that matter financially or for compliance.
const feeAuditSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    trim: true,
    // Examples of action values — not an exhaustive enum since new actions
    // may be added as the system evolves.
    maxlength: 80,
  },
  // Which collection/domain the target record belongs to.
  targetModel: {
    type: String,
    required: true,
    trim: true,
    enum: ['FeeStructure', 'StudentFeeAssignment', 'Invoice', 'Payment', 'PaymentReceipt', 'FeeDiscount'],
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // Snapshot of relevant state before the change (no secrets).
  previousState: { type: mongoose.Schema.Types.Mixed, default: null, select: false },
  // Snapshot of relevant state after the change (no secrets).
  newState: { type: mongoose.Schema.Types.Mixed, default: null, select: false },
  reason: { type: String, trim: true, maxlength: 500, default: null },
  // External provider reference, when relevant (e.g. webhook providerTransactionRef).
  providerRef: { type: String, trim: true, maxlength: 200, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: null, select: false },
}, { timestamps: true, strict: 'throw' });

feeAuditSchema.index({ targetModel: 1, targetId: 1, createdAt: -1 });
feeAuditSchema.index({ performedBy: 1, createdAt: -1 });

module.exports = mongoose.models.FeeAudit || mongoose.model('FeeAudit', feeAuditSchema);
