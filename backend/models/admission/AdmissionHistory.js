// Admission History & Audit Model
// Section 5.10: Complete audit trail for admission actions

const mongoose = require('mongoose');

const admissionHistorySchema = new mongoose.Schema(
  {
    admissionApplicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdmissionApplication',
      required: true,
      index: true,
    },
    
    // Action Information
    actionType: {
      type: String,
      enum: [
        'APPLICATION_CREATED',
        'APPLICATION_SUBMITTED',
        'DOCUMENT_UPLOADED',
        'DOCUMENT_VERIFIED',
        'DOCUMENT_REJECTED',
        'REVIEW_STARTED',
        'REVIEW_COMPLETED',
        'MORE_INFO_REQUESTED',
        'MORE_INFO_PROVIDED',
        'DECISION_APPROVED',
        'DECISION_REJECTED',
        'STUDENT_ONBOARDED',
        'PARENT_LINKED',
        'ENROLLMENT_COMPLETED',
        'STATUS_CHANGED',
        'APPLICATION_UPDATED',
        'NOTIFICATION_SENT',
        'FEE_GENERATED',
        'FEE_PAID',
      ],
      required: true,
      index: true,
    },
    actionDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    
    // Actor Information
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorRole: {
      type: String,
      enum: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'PUBLIC_USER', 'SYSTEM'],
      required: true,
      index: true,
    },
    actorIpAddress: {
      type: String,
      trim: true,
      maxlength: 45,
    },
    actorUserAgent: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    
    // State Changes
    previousState: {
      type: mongoose.Schema.Types.Mixed,
    },
    newState: {
      type: mongoose.Schema.Types.Mixed,
    },
    changedFields: [{
      fieldName: {
        type: String,
        required: true,
        trim: true,
      },
      previousValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
    }],
    
    // Context & Metadata
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    relatedEntityType: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    
    // Technical Information
    requestId: {
      type: String,
      trim: true,
      maxlength: 100,
      index: true,
    },
    correlationId: {
      type: String,
      trim: true,
      maxlength: 100,
      index: true,
    },
    sessionId: {
      type: String,
      trim: true,
      maxlength: 100,
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes for common queries
admissionHistorySchema.index({ admissionApplicationId: 1, createdAt: -1 });
admissionHistorySchema.index({ actorUserId: 1, actionType: 1, createdAt: -1 });
admissionHistorySchema.index({ actionType: 1, createdAt: -1 });
admissionHistorySchema.index({ actorRole: 1, createdAt: -1 });
admissionHistorySchema.index({ requestId: 1 });
admissionHistorySchema.index({ createdAt: -1 });

// Static method to record history
admissionHistorySchema.statics.recordAction = async function({
  admissionApplicationId,
  actionType,
  actionDescription,
  actorUserId,
  actorRole,
  previousState = null,
  newState = null,
  changedFields = [],
  relatedEntityId = null,
  relatedEntityType = null,
  metadata = {},
  actorIpAddress = null,
  actorUserAgent = null,
  requestId = null,
  correlationId = null,
  sessionId = null,
}) {
  const historyEntry = new this({
    admissionApplicationId,
    actionType,
    actionDescription,
    actorUserId,
    actorRole,
    previousState,
    newState,
    changedFields,
    relatedEntityId,
    relatedEntityType,
    metadata,
    actorIpAddress,
    actorUserAgent,
    requestId,
    correlationId,
    sessionId,
  });
  
  return await historyEntry.save();
};

// Pre-save validation
admissionHistorySchema.pre('save', function validateHistory() {
  if (this.previousState && this.newState) {
    const prev = JSON.stringify(this.previousState);
    const curr = JSON.stringify(this.newState);
    
    if (prev === curr && this.changedFields.length === 0) {
      this.invalidate('newState', 'No state change detected for history entry');
    }
  }
});

module.exports = mongoose.models.AdmissionHistory ||
  mongoose.model('AdmissionHistory', admissionHistorySchema);