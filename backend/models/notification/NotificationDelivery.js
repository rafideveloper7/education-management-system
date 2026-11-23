const mongoose = require('mongoose');

const notificationDeliverySchema = new mongoose.Schema({
  notificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', required: true, index: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  channel: { type: String, enum: ['IN_APP', 'EMAIL'], required: true, index: true },
  status: { type: String, enum: ['PENDING', 'SENT', 'FAILED'], required: true, default: 'PENDING', index: true },
  attempts: { type: Number, required: true, default: 0, min: 0 },
  providerResponse: { type: mongoose.Schema.Types.Mixed, default: null, select: false },
  lastError: { type: String, trim: true, maxlength: 2000, default: null, select: false },
  sentAt: { type: Date, default: null },
  nextAttemptAt: { type: Date, default: null, index: true },
}, { timestamps: true, strict: 'throw' });

notificationDeliverySchema.index({ channel: 1, status: 1, nextAttemptAt: 1 });
notificationDeliverySchema.index({ notificationId: 1, channel: 1 }, { unique: true });

module.exports = mongoose.models.NotificationDelivery ||
  mongoose.model('NotificationDelivery', notificationDeliverySchema);
