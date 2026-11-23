const Announcement = require('../../models/communication/Announcement');
const CommunicationAudit = require('../../models/communication/CommunicationAudit');
const User = require('../../models/user/User');
const notificationService = require('../notification/notification.service');
const ApiError = require('../../utils/ApiError');
const {
  createCommunicationAuditService,
  createOneInTransaction,
  withAuditTransaction,
} = require('./audit.service');

const createAnnouncementService = ({
  models = { Announcement, CommunicationAudit, User },
  transaction = withAuditTransaction,
  notifications = notificationService,
  now = () => new Date(),
} = {}) => {
  const audit = createCommunicationAuditService({ model: models.CommunicationAudit });
  const requirePublisher = (actor) => {
    if (actor.role !== 'ADMIN') {
      throw new ApiError(403, 'Only administrators can manage announcements');
    }
  };

  const create = async ({ actor, data }) => {
    requirePublisher(actor);
    if (data.expiresAt && data.expiresAt < now()) {
      throw new ApiError(400, 'expiresAt must be in the future');
    }
    return transaction(async (session) => {
      const announcement = await createOneInTransaction(models.Announcement, {
        ...data,
        createdBy: actor.sub,
        status: 'DRAFT',
      }, session);
      await audit.record({
        session,
        entityType: 'ANNOUNCEMENT',
        entityId: announcement._id,
        action: 'ANNOUNCEMENT_CREATED',
        performedBy: actor.sub,
        newValue: { status: 'DRAFT' },
      });
      return announcement;
    });
  };

  const list = async ({ actor, filters }) => {
    const query = {};
    if (actor.role === 'ADMIN') {
      if (filters.status) query.status = filters.status;
    } else {
      query.status = 'PUBLISHED';
      query.audience = { $in: ['ALL', actor.role] };
      query.$or = [{ expiresAt: null }, { expiresAt: { $gte: now() } }];
    }
    const items = await models.Announcement.find(query)
      .sort({ publishedAt: -1, createdAt: -1, _id: -1 })
      .limit(filters.limit)
      .lean();
    return { items, pagination: { limit: filters.limit, hasMore: false, nextCursor: null } };
  };

  const get = async ({ actor, announcementId }) => {
    const announcement = await models.Announcement.findById(announcementId).lean();
    if (!announcement) throw new ApiError(404, 'Announcement not found');
    if (actor.role !== 'ADMIN') {
      if (announcement.status !== 'PUBLISHED') throw new ApiError(404, 'Announcement not found');
      if (!announcement.audience.includes('ALL') && !announcement.audience.includes(actor.role)) {
        throw new ApiError(403, 'You cannot access this announcement');
      }
      if (announcement.expiresAt && announcement.expiresAt < now()) {
        throw new ApiError(404, 'Announcement not found');
      }
    }
    return announcement;
  };

  const publish = async ({ actor, announcementId }) => {
    requirePublisher(actor);
    const announcement = await models.Announcement.findById(announcementId);
    if (!announcement) throw new ApiError(404, 'Announcement not found');
    if (announcement.status !== 'DRAFT') throw new ApiError(409, 'Only draft announcements can be published');
    announcement.status = 'PUBLISHED';
    announcement.publishedAt = now();
    await transaction(async (session) => {
      await announcement.save({ session });
      await audit.record({
        session,
        entityType: 'ANNOUNCEMENT',
        entityId: announcement._id,
        action: 'ANNOUNCEMENT_PUBLISHED',
        performedBy: actor.sub,
        previousValue: { status: 'DRAFT' },
        newValue: { status: 'PUBLISHED' },
      });
    });
    if (typeof models.User?.find === 'function') {
      const roles = announcement.audience.includes('ALL')
        ? ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']
        : announcement.audience;
      const users = await models.User.find({
        role: { $in: roles },
        status: 'ACTIVE',
      }).select('_id').lean();
      await notifications.publishSafe({
        eventId: `announcement-published:${announcement._id}`,
        type: 'ANNOUNCEMENT_PUBLISHED',
        title: announcement.title,
        message: 'A new school announcement has been published.',
        recipientIds: users.map((user) => user._id),
        referenceId: announcement._id,
        referenceType: 'ANNOUNCEMENT',
        actorId: actor.sub,
      });
    }
    return announcement;
  };

  const archive = async ({ actor, announcementId }) => {
    requirePublisher(actor);
    const announcement = await models.Announcement.findById(announcementId);
    if (!announcement) throw new ApiError(404, 'Announcement not found');
    if (announcement.status === 'ARCHIVED') throw new ApiError(409, 'Announcement is already archived');
    announcement.status = 'ARCHIVED';
    announcement.archivedAt = now();
    await transaction(async (session) => {
      await announcement.save({ session });
      await audit.record({
        session,
        entityType: 'ANNOUNCEMENT',
        entityId: announcement._id,
        action: 'ANNOUNCEMENT_ARCHIVED',
        performedBy: actor.sub,
        previousValue: { status: 'PUBLISHED' },
        newValue: { status: 'ARCHIVED' },
      });
    });
    return announcement;
  };

  return { create, list, get, publish, archive };
};

module.exports = { createAnnouncementService };
