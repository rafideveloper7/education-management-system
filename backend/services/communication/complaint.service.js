const crypto = require('crypto');
const Complaint = require('../../models/communication/Complaint');
const CommunicationAudit = require('../../models/communication/CommunicationAudit');
const User = require('../../models/user/User');
const notificationService = require('../notification/notification.service');
const ApiError = require('../../utils/ApiError');
const {
  createCommunicationAuditService,
  createOneInTransaction,
  withAuditTransaction,
} = require('./audit.service');

const createComplaintService = ({
  models = { Complaint, CommunicationAudit, User },
  transaction = withAuditTransaction,
  notifications = notificationService,
} = {}) => {
  const audit = createCommunicationAuditService({ model: models.CommunicationAudit });
  const createReference = () => `CMP-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

  const requireAdminOrAssignee = (actor, complaint) => {
    if (actor.role === 'ADMIN') return;
    if (!complaint.assignedTo || String(complaint.assignedTo) !== String(actor.sub)) {
      throw new ApiError(403, 'Only an administrator or assigned reviewer can change this complaint');
    }
  };

  const create = async ({ actor, data }) => {
    if (!['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'].includes(actor.role)) {
      throw new ApiError(403, 'This role cannot submit complaints');
    }
    const complaint = await transaction(async (session) => {
      const createdComplaint = await createOneInTransaction(models.Complaint, {
        ...data,
        reference: createReference(),
        submittedBy: actor.sub,
      }, session);
      await audit.record({
        session,
        entityType: 'COMPLAINT',
        entityId: createdComplaint._id,
        action: 'COMPLAINT_SUBMITTED',
        performedBy: actor.sub,
        newValue: { status: createdComplaint.status },
      });
      return createdComplaint;
    });
    if (typeof models.User?.find === 'function') {
      const admins = await models.User.find({ role: 'ADMIN', status: 'ACTIVE' }).select('_id').lean();
      await notifications.publishSafe({
        eventId: `complaint-submitted:${complaint._id}`,
        type: 'COMPLAINT_SUBMITTED',
        title: 'New Complaint',
        message: 'A new complaint has been submitted.',
        recipientIds: admins.map((admin) => admin._id),
        referenceId: complaint._id,
        referenceType: 'COMPLAINT',
        actorId: actor.sub,
      });
    }
    return complaint;
  };

  const list = async ({ actor, filters }) => {
    const query = actor.role === 'ADMIN'
      ? {}
      : {
        $or: [
          { submittedBy: actor.sub },
          { assignedTo: actor.sub },
        ],
      };
    if (filters.status) query.status = filters.status;
    const items = await models.Complaint.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(filters.limit)
      .lean();
    return { items, pagination: { limit: filters.limit, hasMore: false, nextCursor: null } };
  };

  const get = async ({ actor, complaintId }) => {
    const complaint = await models.Complaint.findById(complaintId).lean();
    if (!complaint) throw new ApiError(404, 'Complaint not found');
    if (
      actor.role !== 'ADMIN'
      && String(complaint.submittedBy) !== String(actor.sub)
      && String(complaint.assignedTo) !== String(actor.sub)
    ) {
      throw new ApiError(403, 'You cannot access this complaint');
    }
    return complaint;
  };

  const assign = async ({ actor, complaintId, assignedTo }) => {
    if (actor.role !== 'ADMIN') throw new ApiError(403, 'Only administrators can assign complaints');
    const complaint = await models.Complaint.findById(complaintId);
    if (!complaint) throw new ApiError(404, 'Complaint not found');
    const assignee = await models.User.findOne({
      _id: assignedTo,
      role: { $in: ['ADMIN', 'TEACHER'] },
      status: 'ACTIVE',
    }).lean();
    if (!assignee) throw new ApiError(400, 'assignedTo must identify an active administrator or teacher');
    const previous = complaint.assignedTo;
    complaint.assignedTo = assignedTo;
    await transaction(async (session) => {
      await complaint.save({ session });
      await audit.record({
        session,
        entityType: 'COMPLAINT',
        entityId: complaint._id,
        action: 'COMPLAINT_ASSIGNED',
        performedBy: actor.sub,
        previousValue: { assignedTo: previous },
        newValue: { assignedTo },
      });
    });
    await notifications.publishSafe({
      eventId: `complaint-assigned:${complaint._id}:${assignedTo}`,
      type: 'COMPLAINT_ASSIGNED',
      title: 'Complaint Assigned',
      message: 'A complaint has been assigned to you.',
      recipientIds: [assignedTo],
      referenceId: complaint._id,
      referenceType: 'COMPLAINT',
      actorId: actor.sub,
    });
    return complaint;
  };

  const updateStatus = async ({ actor, complaintId, status, resolutionNote }) => {
    const complaint = await models.Complaint.findById(complaintId);
    if (!complaint) throw new ApiError(404, 'Complaint not found');
    requireAdminOrAssignee(actor, complaint);
    if (complaint.status === 'RESOLVED' || complaint.status === 'REJECTED') {
      throw new ApiError(409, 'A completed complaint cannot change status');
    }
    if (status === 'RESOLVED' && !resolutionNote) {
      throw new ApiError(400, 'resolutionNote is required when resolving a complaint');
    }
    const previousStatus = complaint.status;
    complaint.status = status;
    complaint.reviewedBy = actor.sub;
    if (status === 'RESOLVED') {
      complaint.resolvedAt = new Date();
      complaint.resolutionNote = resolutionNote;
    }
    await transaction(async (session) => {
      await complaint.save({ session });
      await audit.record({
        session,
        entityType: 'COMPLAINT',
        entityId: complaint._id,
        action: 'COMPLAINT_STATUS_UPDATED',
        performedBy: actor.sub,
        previousValue: { status: previousStatus },
        newValue: { status },
      });
    });
    await notifications.publishSafe({
      eventId: `complaint-status:${complaint._id}:${status}`,
      type: 'COMPLAINT_STATUS_UPDATED',
      title: 'Complaint Status Updated',
      message: `Your complaint status is now ${status.toLowerCase().replace('_', ' ')}.`,
      recipientIds: [complaint.submittedBy],
      referenceId: complaint._id,
      referenceType: 'COMPLAINT',
      actorId: actor.sub,
    });
    return complaint;
  };

  return { create, list, get, assign, updateStatus };
};

module.exports = { createComplaintService };
