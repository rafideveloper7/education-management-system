const express = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermissions } = require('../../authorization/middleware/permission.middleware');
const { PERMISSIONS } = require('../../authorization/constants/permissions.constants');
const { validateRequest } = require('../../middleware/validateRequest.middleware');
const validators = require('../../validators/attendance/attendance.validator');
const controller = require('../../controllers/attendance.controller');

const router = express.Router();

router.patch('/:recordId',
  authenticate,
  requirePermissions(PERMISSIONS.ATTENDANCE_CORRECT),
  validateRequest({ params: validators.recordParamsSchema, body: validators.correctionSchema }),
  controller.correctAttendance);

module.exports = router;