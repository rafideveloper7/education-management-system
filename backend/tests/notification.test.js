const test = require('node:test');
const assert = require('node:assert/strict');

process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/notification-tests';
process.env.JWT_ACCESS_SECRET ||= 'notification-tests-access-secret';
process.env.JWT_REFRESH_SECRET ||= 'notification-tests-refresh-secret';

const { createNotificationService } = require('../services/notification/notification.service');
const validators = require('../validators/notification/notification.validator');
const { createEmailService } = require('../services/notification/email.service');

const recipientId = '64b000000000000000000001';
const otherRecipientId = '64b000000000000000000002';

test('notification list query validates limit and read filter', () => {
  const parsed = validators.notificationListQuerySchema.safeParse({
    limit: '25',
    isRead: 'false',
  });
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.limit, 25);
  assert.equal(parsed.data.isRead, false);
});

test('notification access is scoped to the authenticated recipient', async () => {
  const notification = {
    _id: '64b000000000000000000010',
    recipientId,
    isRead: false,
  };
  const service = createNotificationService({
    models: {
      Notification: {
        findOne: ({ _id, recipientId: requestedRecipientId }) => ({
          lean: async () => (
            String(_id) === String(notification._id)
            && String(requestedRecipientId) === String(recipientId)
              ? notification
              : null
          ),
        }),
      },
      User: {},
    },
  });

  const found = await service.getById({
    actor: { sub: recipientId },
    notificationId: notification._id,
  });
  assert.equal(found._id, notification._id);

  await assert.rejects(
    service.getById({
      actor: { sub: otherRecipientId },
      notificationId: notification._id,
    }),
    (error) => error.statusCode === 404
  );
});

test('mark read rejects another users notification', async () => {
  const service = createNotificationService({
    models: {
      Notification: {
        findOneAndUpdate: () => ({
          lean: async () => null,
        }),
      },
      User: {},
    },
  });

  await assert.rejects(
    service.markRead({
      actor: { sub: otherRecipientId },
      notificationId: '64b000000000000000000010',
    }),
    (error) => error.statusCode === 404
  );
});

test('mark all read updates only the authenticated recipients unread notifications', async () => {
  let filter;
  let update;
  const service = createNotificationService({
    models: {
      Notification: {
        updateMany: async (receivedFilter, receivedUpdate) => {
          filter = receivedFilter;
          update = receivedUpdate;
          return { modifiedCount: 3 };
        },
      },
      User: {},
    },
  });

  const result = await service.markAllRead({ actor: { sub: recipientId } });
  assert.equal(result.modifiedCount, 3);
  assert.equal(filter.recipientId, recipientId);
  assert.equal(filter.isRead, false);
  assert.equal(update.$set.isRead, true);
});

test('same event and recipient does not create duplicate notifications', async () => {
  let createCount = 0;
  let firstExisting = null;
  const service = createNotificationService({
    models: {
      Notification: {
        findOne: () => ({
          lean: async () => firstExisting,
        }),
        create: async (data) => {
          createCount += 1;
          firstExisting = data;
          return { _id: '64b000000000000000000010', ...data };
        },
      },
      User: {
        find: () => ({
          select: () => ({
            lean: async () => [{ _id: recipientId }],
          }),
        }),
      },
    },
  });

  await service.publish({
    eventId: 'leave-request-approved:64b000000000000000000020',
    type: 'LEAVE_REQUEST_APPROVED',
    title: 'Leave Approved',
    message: 'Your leave request was approved.',
    recipientIds: [recipientId],
    referenceId: '64b000000000000000000020',
    referenceType: 'LEAVE_REQUEST',
  });
  await service.publish({
    eventId: 'leave-request-approved:64b000000000000000000020',
    type: 'LEAVE_REQUEST_APPROVED',
    title: 'Leave Approved',
    message: 'Your leave request was approved.',
    recipientIds: [recipientId],
    referenceId: '64b000000000000000000020',
    referenceType: 'LEAVE_REQUEST',
  });

  assert.equal(createCount, 1);
});

test('unread count is calculated for the authenticated recipient', async () => {
  const service = createNotificationService({
    models: {
      Notification: {
        countDocuments: async (filter) => {
          assert.equal(filter.recipientId, recipientId);
          assert.equal(filter.isRead, false);
          return 4;
        },
      },
      User: {},
    },
  });

  const result = await service.unreadCount({ actor: { sub: recipientId } });
  assert.equal(result.unreadCount, 4);
});

test('email delivery sends title and message through the configured transport', async () => {
  let mail;
  const emailService = createEmailService({
    transporter: {
      sendMail: async (payload) => {
        mail = payload;
        return { messageId: 'smtp-message-1' };
      },
    },
  });

  const result = await emailService.send({
    to: 'parent@example.com',
    subject: 'Leave Approved',
    text: 'Your leave request has been approved.',
  });

  assert.equal(result.messageId, 'smtp-message-1');
  assert.equal(mail.to, 'parent@example.com');
  assert.equal(mail.subject, 'Leave Approved');
  assert.equal(mail.text, 'Your leave request has been approved.');
});
