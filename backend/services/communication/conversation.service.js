const Conversation = require('../../models/communication/Conversation');
const Message = require('../../models/communication/Message');
const CommunicationAudit = require('../../models/communication/CommunicationAudit');
const User = require('../../models/user/User');
const notificationService = require('../notification/notification.service');
const ApiError = require('../../utils/ApiError');
const {
  createCommunicationAuditService,
  createOneInTransaction,
  withAuditTransaction,
} = require('./audit.service');

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
    throw new ApiError(400, 'cursor must be a valid conversation or message cursor', { code: 'INVALID_CURSOR' });
  }
};

const createConversationService = ({
  models = { Conversation, Message, CommunicationAudit, User },
  transaction = withAuditTransaction,
  notifications = notificationService,
  now = () => new Date(),
} = {}) => {
  const audit = createCommunicationAuditService({ model: models.CommunicationAudit });
  const requireObjectId = (value, field) => {
    if (!OBJECT_ID_PATTERN.test(String(value || ''))) {
      throw new ApiError(400, `${field} must be a valid ObjectId`);
    }
  };

  const requireParticipant = (conversation, userId) => {
    if (!conversation.participants.some((participant) =>
      String(participant.userId) === String(userId) && participant.isActive
    )) {
      throw new ApiError(403, 'You are not a participant in this conversation');
    }
  };

  const getConversation = async (conversationId, actor) => {
    requireObjectId(conversationId, 'conversationId');
    const conversation = await models.Conversation.findById(conversationId).lean();
    if (!conversation) throw new ApiError(404, 'Conversation not found');
    requireParticipant(conversation, actor.sub);
    if (conversation.status !== 'ACTIVE') throw new ApiError(409, 'Conversation is not active');
    return conversation;
  };

  const createConversation = async ({ actor, participantIds, title }) => {
    if (actor.role === 'PUBLIC_USER') throw new ApiError(403, 'Public users cannot create internal conversations');
    if (!Array.from(new Set(participantIds)).length) throw new ApiError(400, 'At least one participant is required');

    const ids = [...new Set([String(actor.sub), ...participantIds])];
    if (ids.length !== 2) throw new ApiError(400, 'Direct conversations require exactly one other participant');

    const users = await models.User.find({
      _id: { $in: ids },
      role: { $in: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
      status: 'ACTIVE',
    }).select('_id role').lean();
    if (users.length !== ids.length) throw new ApiError(400, 'Every participant must be an active internal user');

    const existing = await models.Conversation.findDirectConversation(ids[0], ids[1]);
    if (existing) return existing;

    const roleById = new Map(users.map((user) => [String(user._id), user.role]));
    return transaction(async (session) => {
      const conversation = await createOneInTransaction(models.Conversation, {
        participants: ids.map((userId) => ({ userId, role: roleById.get(userId) })),
        title,
        conversationType: 'DIRECT',
        status: 'ACTIVE',
        createdByUserId: actor.sub,
        lastMessageAt: now(),
      }, session);

      await audit.record({
        session,
        entityType: 'CONVERSATION',
        entityId: conversation._id,
        action: 'CONVERSATION_CREATED',
        performedBy: actor.sub,
        newValue: { participantIds: ids, status: 'ACTIVE' },
      });
      return conversation;
    });
  };

  const listConversations = async ({ actor, filters }) => {
    const query = {
      'participants.userId': actor.sub,
      'participants.isActive': true,
      status: 'ACTIVE',
    };
    if (filters?.cursor) {
      const position = decodeCursor(filters.cursor);
      query.$or = [
        { lastMessageAt: { $lt: position.createdAt } },
        { lastMessageAt: position.createdAt, _id: { $lt: position.id } },
      ];
    }
    const records = await models.Conversation.find(query)
      .sort({ lastMessageAt: -1, _id: -1 })
      .limit((filters?.limit || 50) + 1)
      .lean();
    const hasMore = records.length > (filters?.limit || 50);
    const items = hasMore ? records.slice(0, filters.limit) : records;
    return {
      items,
      pagination: {
        limit: filters.limit,
        hasMore,
        nextCursor: hasMore ? encodeCursor({
          ...items[items.length - 1],
          createdAt: items[items.length - 1].lastMessageAt || items[items.length - 1].createdAt,
        }) : null,
      },
    };
  };

  const sendMessage = async ({ actor, conversationId, content, requestId }) => {
    const conversation = await getConversation(conversationId, actor);
    const message = await transaction(async (session) => {
      const createdMessage = await createOneInTransaction(models.Message, {
        conversationId: conversation._id,
        senderId: actor.sub,
        content,
      }, session);
      await models.Conversation.findByIdAndUpdate(conversation._id, {
        $set: {
          lastMessageAt: createdMessage.createdAt,
          lastMessageId: createdMessage._id,
          lastMessageContent: content,
          lastMessageSenderId: actor.sub,
          updatedAt: new Date(),
        },
      }, { session });
      await audit.record({
        session,
        entityType: 'MESSAGE',
        entityId: createdMessage._id,
        action: 'MESSAGE_CREATED',
        performedBy: actor.sub,
        requestId: requestId || null,
        newValue: { conversationId: conversation._id },
      });
      return createdMessage;
    });
    const recipientIds = conversation.participants
      .filter((participant) => participant.isActive)
      .map((participant) => participant.userId)
      .filter((userId) => String(userId) !== String(actor.sub));
    await notifications.publishSafe({
      eventId: `message-created:${message._id}`,
      type: 'MESSAGE_CREATED',
      title: 'New Message',
      message: 'You have received a new message.',
      recipientIds,
      referenceId: conversation._id,
      referenceType: 'CONVERSATION',
      actorId: actor.sub,
    });
    return message;
  };

  const listMessages = async ({ actor, conversationId, filters }) => {
    const conversation = await getConversation(conversationId, actor);
    const query = { conversationId: conversation._id, deletedAt: null };
    if (filters.cursor) {
      const position = decodeCursor(filters.cursor);
      query.$or = [
        { createdAt: { $lt: position.createdAt } },
        { createdAt: position.createdAt, _id: { $lt: position.id } },
      ];
    }
    const records = await models.Message.find(query)
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

  return { createConversation, listConversations, getConversation, sendMessage, listMessages };
};

module.exports = { createConversationService };
