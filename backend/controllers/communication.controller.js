const { createConversationService } = require('../services/communication/conversation.service');
const { createComplaintService } = require('../services/communication/complaint.service');
const { createLeaveRequestService } = require('../services/communication/leave-request.service');
const { createAnnouncementService } = require('../services/communication/announcement.service');
const { createCommunicationAuditService } = require('../services/communication/audit.service');

const conversations = createConversationService();
const complaints = createComplaintService();
const leaveRequests = createLeaveRequestService();
const announcements = createAnnouncementService();
const audit = createCommunicationAuditService();

const sendOk = (res, data, status = 200) => res.status(status).json({ success: true, data });
const sendPage = (res, page) => res.status(200).json({
  success: true,
  data: page.items,
  pagination: page.pagination,
});
const wrap = (handler) => async (req, res, next) => {
  try { await handler(req, res); } catch (error) { next(error); }
};

module.exports = {
  createConversation: wrap(async (req, res) => sendOk(res, await conversations.createConversation({
    actor: req.user,
    participantIds: [req.validated.body.participantId],
    title: req.validated.body.title,
  }), 201)),
  listConversations: wrap(async (req, res) => sendPage(res, await conversations.listConversations({
    actor: req.user,
    filters: req.validated.query,
  }))),
  getConversation: wrap(async (req, res) => sendOk(res, await conversations.getConversation(
    req.validated.params.conversationId,
    req.user
  ))),
  sendMessage: wrap(async (req, res) => sendOk(res, await conversations.sendMessage({
    actor: req.user,
    conversationId: req.validated.params.conversationId,
    content: req.validated.body.content,
    requestId: req.requestId,
  }), 201)),
  listMessages: wrap(async (req, res) => sendPage(res, await conversations.listMessages({
    actor: req.user,
    conversationId: req.validated.params.conversationId,
    filters: req.validated.query,
  }))),

  createComplaint: wrap(async (req, res) => sendOk(res, await complaints.create({ actor: req.user, data: req.validated.body }), 201)),
  listComplaints: wrap(async (req, res) => sendOk(res, await complaints.list({ actor: req.user, filters: req.validated.query }))),
  getComplaint: wrap(async (req, res) => sendOk(res, await complaints.get({ actor: req.user, complaintId: req.validated.params.complaintId }))),
  assignComplaint: wrap(async (req, res) => sendOk(res, await complaints.assign({ actor: req.user, complaintId: req.validated.params.complaintId, ...req.validated.body }))),
  updateComplaintStatus: wrap(async (req, res) => sendOk(res, await complaints.updateStatus({ actor: req.user, complaintId: req.validated.params.complaintId, ...req.validated.body }))),

  createLeaveRequest: wrap(async (req, res) => sendOk(res, await leaveRequests.create({ actor: req.user, data: req.validated.body }), 201)),
  listLeaveRequests: wrap(async (req, res) => sendOk(res, await leaveRequests.list({ actor: req.user, filters: req.validated.query }))),
  getLeaveRequest: wrap(async (req, res) => sendOk(res, await leaveRequests.get({ actor: req.user, leaveRequestId: req.validated.params.leaveRequestId }))),
  reviewLeaveRequest: wrap(async (req, res) => sendOk(res, await leaveRequests.review({ actor: req.user, leaveRequestId: req.validated.params.leaveRequestId, ...req.validated.body }))),

  createAnnouncement: wrap(async (req, res) => sendOk(res, await announcements.create({ actor: req.user, data: req.validated.body }), 201)),
  listAnnouncements: wrap(async (req, res) => sendOk(res, await announcements.list({ actor: req.user, filters: req.validated.query }))),
  getAnnouncement: wrap(async (req, res) => sendOk(res, await announcements.get({ actor: req.user, announcementId: req.validated.params.announcementId }))),
  publishAnnouncement: wrap(async (req, res) => sendOk(res, await announcements.publish({ actor: req.user, announcementId: req.validated.params.announcementId }))),
  archiveAnnouncement: wrap(async (req, res) => sendOk(res, await announcements.archive({ actor: req.user, announcementId: req.validated.params.announcementId }))),

  listCommunicationAudit: wrap(async (req, res) => sendOk(res, await audit.listByEntity({
    actor: req.user,
    entityType: req.validated.params.entityType,
    entityId: req.validated.params.entityId,
  }))),
  listAuditLogs: wrap(async (req, res) => sendPage(res, await audit.list({
    actor: req.user,
    filters: req.validated.query,
  }))),
  getAuditLog: wrap(async (req, res) => sendOk(res, await audit.getById({
    actor: req.user,
    auditId: req.validated.params.auditId,
  }))),
  listAuditHistory: wrap(async (req, res) => sendPage(res, await audit.listHistory({
    actor: req.user,
    entityType: req.validated.params.entityType,
    entityId: req.validated.params.entityId,
    filters: req.validated.query,
  }))),
};
