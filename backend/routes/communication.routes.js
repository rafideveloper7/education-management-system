const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermissions } = require('../authorization/middleware/permission.middleware');
const { PERMISSIONS } = require('../authorization/constants/permissions.constants');
const { validateRequest } = require('../middleware/validateRequest.middleware');
const validators = require('../validators/communication/communication.validator');
const controller = require('../controllers/communication.controller');

const router = express.Router();
router.use(authenticate);

router.post('/conversations', requirePermissions(PERMISSIONS.MESSAGE_CREATE),
  validateRequest({ body: validators.conversationCreateSchema }), controller.createConversation);
router.get('/conversations', requirePermissions(PERMISSIONS.MESSAGE_READ),
  validateRequest({ query: validators.listQuerySchema }), controller.listConversations);
router.get('/conversations/:conversationId', requirePermissions(PERMISSIONS.MESSAGE_READ),
  validateRequest({ params: validators.conversationParamsSchema }), controller.getConversation);
router.post('/conversations/:conversationId/messages', requirePermissions(PERMISSIONS.MESSAGE_SEND),
  validateRequest({ params: validators.conversationParamsSchema, body: validators.messageCreateSchema }), controller.sendMessage);
router.get('/conversations/:conversationId/messages', requirePermissions(PERMISSIONS.MESSAGE_READ),
  validateRequest({ params: validators.conversationParamsSchema, query: validators.listQuerySchema }), controller.listMessages);

router.post('/complaints', requirePermissions(PERMISSIONS.COMPLAINT_CREATE),
  validateRequest({ body: validators.complaintCreateSchema }), controller.createComplaint);
router.get('/complaints', requirePermissions(PERMISSIONS.COMPLAINT_READ),
  validateRequest({ query: validators.listQuerySchema }), controller.listComplaints);
router.get('/complaints/:complaintId', requirePermissions(PERMISSIONS.COMPLAINT_READ),
  validateRequest({ params: validators.complaintParamsSchema }), controller.getComplaint);
router.patch('/complaints/:complaintId/assign', requirePermissions(PERMISSIONS.COMPLAINT_ASSIGN),
  validateRequest({ params: validators.complaintParamsSchema, body: validators.complaintAssignSchema }), controller.assignComplaint);
router.patch('/complaints/:complaintId/status', requirePermissions(PERMISSIONS.COMPLAINT_UPDATE_STATUS),
  validateRequest({ params: validators.complaintParamsSchema, body: validators.complaintStatusSchema }), controller.updateComplaintStatus);

router.post('/leave-requests', requirePermissions(PERMISSIONS.LEAVE_CREATE),
  validateRequest({ body: validators.leaveRequestCreateSchema }), controller.createLeaveRequest);
router.get('/leave-requests', requirePermissions(PERMISSIONS.LEAVE_READ),
  validateRequest({ query: validators.listQuerySchema }), controller.listLeaveRequests);
router.get('/leave-requests/:leaveRequestId', requirePermissions(PERMISSIONS.LEAVE_READ),
  validateRequest({ params: validators.leaveRequestParamsSchema }), controller.getLeaveRequest);
router.patch('/leave-requests/:leaveRequestId/review', requirePermissions(PERMISSIONS.LEAVE_REVIEW),
  validateRequest({ params: validators.leaveRequestParamsSchema, body: validators.leaveReviewSchema }), controller.reviewLeaveRequest);

router.post('/announcements', requirePermissions(PERMISSIONS.ANNOUNCEMENT_CREATE),
  validateRequest({ body: validators.announcementCreateSchema }), controller.createAnnouncement);
router.get('/announcements', requirePermissions(PERMISSIONS.ANNOUNCEMENT_READ),
  validateRequest({ query: validators.listQuerySchema }), controller.listAnnouncements);
router.get('/announcements/:announcementId', requirePermissions(PERMISSIONS.ANNOUNCEMENT_READ),
  validateRequest({ params: validators.announcementParamsSchema }), controller.getAnnouncement);
router.patch('/announcements/:announcementId/publish', requirePermissions(PERMISSIONS.ANNOUNCEMENT_PUBLISH),
  validateRequest({ params: validators.announcementParamsSchema }), controller.publishAnnouncement);
router.patch('/announcements/:announcementId/archive', requirePermissions(PERMISSIONS.ANNOUNCEMENT_PUBLISH),
  validateRequest({ params: validators.announcementParamsSchema }), controller.archiveAnnouncement);

router.get('/communication-history/:entityType/:entityId',
  requirePermissions(PERMISSIONS.COMMUNICATION_HISTORY_VIEW),
  validateRequest({ params: validators.auditParamsSchema }),
  controller.listCommunicationAudit);

router.get('/audit-logs',
  requirePermissions(PERMISSIONS.AUDIT_LOG_READ),
  validateRequest({ query: validators.auditListQuerySchema }),
  controller.listAuditLogs);
router.get('/audit-logs/:auditId',
  requirePermissions(PERMISSIONS.AUDIT_LOG_READ),
  validateRequest({ params: validators.auditIdParamsSchema }),
  controller.getAuditLog);
router.get('/audit-logs/entities/:entityType/:entityId/history',
  requirePermissions(PERMISSIONS.AUDIT_LOG_READ),
  validateRequest({
    params: validators.auditParamsSchema,
    query: validators.auditListQuerySchema,
  }),
  controller.listAuditHistory);

module.exports = router;
