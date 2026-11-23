const Notification = require('../../models/notification/Notification');
const NotificationDelivery = require('../../models/notification/NotificationDelivery');
const User = require('../../models/user/User');
const env = require('../../config/env');
const { createNotificationQueue } = require('../../config/queue');
const ApiError = require('../../utils/ApiError');

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const encodeCursor = (record) => Buffer.from(JSON.stringify({
  version: 1,
  createdAt: new Date(record.createdAt).toISOString(),
  id: String(record._id),
})).toString('base64url');

const decodeCursor = (cursor) => {
  try {
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    const createdAt = new Date(value.createdAt);
    if (value.version !== 1 || !OBJECT_ID_PATTERN.test(value.id) || Number.isNaN(createdAt.getTime())) {
      throw new Error('Invalid cursor');
    }
    return { createdAt, id: value.id };
  } catch {
    throw new ApiError(400, 'cursor must be a valid notification cursor', { code: 'INVALID_CURSOR' });
  }
};

const createNotificationService = ({
  models = { Notification, NotificationDelivery, User },
  now = () => new Date(),
} = {}) => {
  const publish = async ({
    eventId,
    type,
    title,
    message,
    recipientIds,
    referenceId = null,
    referenceType = null,
    actorId = null,
  }) => {
    if (!eventId || typeof eventId !== 'string') {
      throw new ApiError(400, 'eventId is required');
    }
    if (!title || !message) {
      throw new ApiError(400, 'Notification title and message are required');
    }

    const uniqueRecipientIds = [...new Set(
      (recipientIds || []).map((id) => String(id)).filter((id) => OBJECT_ID_PATTERN.test(id))
    )];
    if (uniqueRecipientIds.length === 0) return [];

    const users = await models.User.find({
      _id: { $in: uniqueRecipientIds },
      status: 'ACTIVE',
    }).select('_id email').lean();
    const validRecipientIds = new Set(users.map((user) => String(user._id)));
    const userById = new Map(users.map((user) => [String(user._id), user]));
    const queue = env.redisUrl && env.smtpHost ? createNotificationQueue() : null;

    const created = [];
    for (const recipientId of uniqueRecipientIds) {
      if (!validRecipientIds.has(recipientId)) continue;
      try {
        const existing = await models.Notification.findOne({ eventId, recipientId }).lean();
        if (existing) continue;
        const notification = await models.Notification.create({
          recipientId,
          actorId,
          eventId,
          type,
          title,
          message,
          referenceId,
          referenceType,
          isRead: false,
          readAt: null,
        });
        created.push(notification);
        const recipient = userById.get(recipientId);
        if (queue && recipient?.email && models.NotificationDelivery) {
          try {
            const delivery = await models.NotificationDelivery.create({
              notificationId: notification._id,
              recipientId,
              channel: 'EMAIL',
              status: 'PENDING',
              attempts: 0,
            });
            await queue.add(
              'notification-delivery',
              { deliveryId: String(delivery._id) },
              {
                jobId: `notification-email:${delivery._id}`,
                attempts: 5,
                backoff: { type: 'exponential', delay: 60_000 },
                removeOnComplete: 1000,
                removeOnFail: 5000,
              }
            );
          } catch (error) {
            console.error('Failed to enqueue notification email', {
              notificationId: String(notification._id),
              error: error.message,
            });
          }
        }
      } catch (error) {
        if (error?.code !== 11000) throw error;
      }
    }
    return created;
  };

  const publishSafe = async (payload) => {
    try {
      return await publish(payload);
    } catch (error) {
      console.error('Notification delivery failed', {
        eventId: payload.eventId,
        type: payload.type,
        error: error?.message,
      });
      return [];
    }
  };

  const list = async ({ actor, filters }) => {
    const query = { recipientId: actor.sub };
    if (filters.isRead !== undefined) query.isRead = filters.isRead;
    if (filters.cursor) {
      const position = decodeCursor(filters.cursor);
      query.$or = [
        { createdAt: { $lt: position.createdAt } },
        { createdAt: position.createdAt, _id: { $lt: position.id } },
      ];
    }

    const records = await models.Notification.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(filters.limit + 1)
      .lean();
    const hasMore = records.length > filters.limit;
    const items = hasMore ? records.slice(0, filters.limit) : records;
    return {
      items,
      pagination: {
        limit: filters.limit,
        hasMore,
        nextCursor: hasMore ? encodeCursor(items[items.length - 1]) : null,
      },
    };
  };

  const getById = async ({ actor, notificationId }) => {
    if (!OBJECT_ID_PATTERN.test(String(notificationId || ''))) {
      throw new ApiError(400, 'notificationId must be a valid ObjectId');
    }
    const notification = await models.Notification.findOne({
      _id: notificationId,
      recipientId: actor.sub,
    }).lean();
    if (!notification) throw new ApiError(404, 'Notification not found');
    return notification;
  };

  const markRead = async ({ actor, notificationId }) => {
    if (!OBJECT_ID_PATTERN.test(String(notificationId || ''))) {
      throw new ApiError(400, 'notificationId must be a valid ObjectId');
    }
    const notification = await models.Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: actor.sub },
      { $set: { isRead: true, readAt: now() } },
      { new: true }
    ).lean();
    if (!notification) throw new ApiError(404, 'Notification not found');
    return notification;
  };

  const markAllRead = async ({ actor }) => {
    const result = await models.Notification.updateMany(
      { recipientId: actor.sub, isRead: false },
      { $set: { isRead: true, readAt: now() } }
    );
    return { modifiedCount: result.modifiedCount || 0 };
  };

  const unreadCount = async ({ actor }) => ({
    unreadCount: await models.Notification.countDocuments({
      recipientId: actor.sub,
      isRead: false,
    }),
  });

  return { publish, publishSafe, list, getById, markRead, markAllRead, unreadCount };
};

const notificationService = createNotificationService();

module.exports = { ...notificationService, createNotificationService };
