const Notification = require('../models/notification/Notification');
const NotificationDelivery = require('../models/notification/NotificationDelivery');
const User = require('../models/user/User');
const emailService = require('../services/notification/email.service');

const processNotificationDelivery = async ({ data }) => {
  const delivery = await NotificationDelivery.findById(data.deliveryId);
  if (!delivery) return { skipped: true };
  if (delivery.status === 'SENT') return { skipped: true };

  if (delivery.attempts >= 5) {
    delivery.status = 'FAILED';
    delivery.lastError = 'Retry limit exhausted';
    await delivery.save();
    return { failed: true };
  }

  delivery.attempts += 1;
  try {
    const [notification, recipient] = await Promise.all([
      Notification.findById(delivery.notificationId).lean(),
      User.findById(delivery.recipientId).select('email').lean(),
    ]);
    if (!notification || !recipient?.email) throw new Error('Notification or email recipient is unavailable');

    const response = await emailService.send({
      to: recipient.email,
      subject: notification.title,
      text: notification.message,
    });
    delivery.status = 'SENT';
    delivery.sentAt = new Date();
    delivery.providerResponse = { messageId: response?.messageId || null };
    delivery.lastError = null;
    await delivery.save();
    return { sent: true };
  } catch (error) {
    delivery.status = 'PENDING';
    delivery.lastError = error.message;
    delivery.nextAttemptAt = new Date(Date.now() + 60_000 * delivery.attempts);
    await delivery.save();
    throw error;
  }
};

module.exports = { processNotificationDelivery };
