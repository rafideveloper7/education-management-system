const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermissions } = require('../authorization/middleware/permission.middleware');
const { PERMISSIONS } = require('../authorization/constants/permissions.constants');
const { validateRequest } = require('../middleware/validateRequest.middleware');
const validators = require('../validators/notification/notification.validator');
const controller = require('../controllers/notification.controller');

const router = express.Router();
router.use(authenticate);

router.get('/notifications/unread-count',
  requirePermissions(PERMISSIONS.NOTIFICATION_READ),
  controller.unreadCount);

router.patch('/notifications/read-all',
  requirePermissions(PERMISSIONS.NOTIFICATION_READ),
  controller.markAllRead);

router.get('/notifications',
  requirePermissions(PERMISSIONS.NOTIFICATION_READ),
  validateRequest({ query: validators.notificationListQuerySchema }),
  controller.list);

router.get('/notifications/:notificationId',
  requirePermissions(PERMISSIONS.NOTIFICATION_READ),
  validateRequest({ params: validators.notificationParamsSchema }),
  controller.getById);

router.patch('/notifications/:notificationId/read',
  requirePermissions(PERMISSIONS.NOTIFICATION_READ),
  validateRequest({ params: validators.notificationParamsSchema }),
  controller.markRead);

module.exports = router;
