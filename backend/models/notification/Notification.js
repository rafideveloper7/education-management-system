const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  eventId: { type: String, required: true, trim: true, maxlength: 256, index: true },
  type: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    enum: [
      'MESSAGE_CREATED',
      'COMPLAINT_SUBMITTED',
      'COMPLAINT_ASSIGNED',
      'COMPLAINT_STATUS_UPDATED',
      'LEAVE_REQUEST_SUBMITTED',
      'LEAVE_REQUEST_APPROVED',
      'LEAVE_REQUEST_REJECTED',
      'ANNOUNCEMENT_PUBLISHED',
      'PAYMENT_SUCCEEDED',
      'PAYMENT_FAILED',
      'ADMISSION_APPROVED',
      'ADMISSION_REJECTED',
    ],
  },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  referenceId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
  referenceType: { type: String, trim: true, maxlength: 100, default: null },
  isRead: { type: Boolean, required: true, default: false, index: true },
  readAt: { type: Date, default: null },
}, { timestamps: true, strict: 'throw' });

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1, _id: -1 });
notificationSchema.index({ eventId: 1, recipientId: 1 }, { unique: true });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
