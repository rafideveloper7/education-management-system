const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermissions } = require('../authorization/middleware/permission.middleware');
const { PERMISSIONS } = require('../authorization/constants/permissions.constants');
const { validateRequest } = require('../middleware/validateRequest.middleware');
const validators = require('../validators/attendance/attendance.validator');
const controller = require('../controllers/attendance.controller');

const router = express.Router();
router.use(authenticate);

router.post('/sections/:sectionId/mark',
  requirePermissions(PERMISSIONS.ATTENDANCE_MARK),
  validateRequest({ params: validators.sectionParamsSchema, body: validators.markBatchSchema }),
  controller.markSectionAttendance);

router.get('/sections/:sectionId',
  requirePermissions(PERMISSIONS.ATTENDANCE_VIEW),
  validateRequest({ params: validators.sectionParamsSchema, query: validators.sectionAttendanceQuerySchema }),
  controller.listSectionAttendance);

router.get('/students/:studentUserId',
  requirePermissions(PERMISSIONS.ATTENDANCE_VIEW),
  validateRequest({
    params: validators.studentHistoryParamsSchema,
    query: validators.studentHistoryQuerySchema,
  }),
  controller.listStudentAttendance);

module.exports = router;