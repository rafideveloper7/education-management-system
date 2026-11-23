// Conversation Model
// Section 3: Conversation between participants

const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    // Participants
    participants: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },
      role: {
        type: String,
        enum: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
        required: true,
      },
      joinedAt: {
        type: Date,
        required: true,
        default: Date.now,
      },
      leftAt: {
        type: Date,
        default: null,
      },
      isActive: {
        type: Boolean,
        required: true,
        default: true,
      },
    }],
    
    // Conversation Info
    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    conversationType: {
      type: String,
      enum: ['DIRECT', 'GROUP', 'CLASS', 'SYSTEM'],
      required: true,
      default: 'DIRECT',
      index: true,
    },
    
    // Context (for class/system conversations)
    academicSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      index: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      index: true,
    },
    
    // Status
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED', 'CLOSED'],
      required: true,
      default: 'ACTIVE',
      index: true,
    },
    
    // Activity Tracking
    lastMessageAt: {
      type: Date,
      index: true,
    },
    lastMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastMessageContent: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    lastMessageSenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    
    // Metadata
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes
conversationSchema.index({ 'participants.userId': 1, status: 1, lastMessageAt: -1 });
conversationSchema.index({ conversationType: 1, status: 1 });
conversationSchema.index({ classId: 1, sectionId: 1, status: 1 });
conversationSchema.index({ lastMessageAt: -1 });

// Validation
conversationSchema.pre('validate', function validateConversation() {
  // Ensure at least 2 participants for direct conversations
  if (this.conversationType === 'DIRECT') {
    const activeParticipants = this.participants.filter(p => p.isActive);
    if (activeParticipants.length < 2) {
      this.invalidate('participants', 'Direct conversations require at least 2 active participants');
    }
    
    // For direct conversations, ensure unique participants
    const participantIds = activeParticipants.map(p => p.userId.toString());
    const uniqueIds = [...new Set(participantIds)];
    if (participantIds.length !== uniqueIds.length) {
      this.invalidate('participants', 'Duplicate participants in conversation');
    }
  }
  
  // Ensure user cannot be in conversation with themselves
  const selfConversation = this.participants.some(p => 
    p.userId && this.createdByUserId && p.userId.toString() === this.createdByUserId.toString()
  );
  if (selfConversation && this.conversationType === 'DIRECT' && this.participants.length === 1) {
    this.invalidate('participants', 'User cannot create direct conversation with themselves');
  }
});

// Update timestamps
conversationSchema.pre('save', function updateTimestamps(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to check if user is participant
conversationSchema.statics.isParticipant = async function(conversationId, userId) {
  const conversation = await this.findOne({
    _id: conversationId,
    'participants.userId': userId,
    'participants.isActive': true,
    status: 'ACTIVE',
  });
  return !!conversation;
};

// Static method to get conversation between two users
conversationSchema.statics.findDirectConversation = async function(userId1, userId2) {
  return await this.findOne({
    conversationType: 'DIRECT',
    status: 'ACTIVE',
    'participants.userId': { $all: [userId1, userId2] },
    'participants.isActive': true,
  });
};

module.exports = mongoose.models.Conversation ||
  mongoose.model('Conversation', conversationSchema);