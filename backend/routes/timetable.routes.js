const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermissions } = require('../authorization/middleware/permission.middleware');
const { PERMISSIONS } = require('../authorization/constants/permissions.constants');
const { validateRequest } = require('../middleware/validateRequest.middleware');
const validators = require('../validators/timetable.validator');
const controller = require('../controllers/timetable.controller');

const router = express.Router();
router.use(authenticate);

router.post('/timetable/entries',
  requirePermissions(PERMISSIONS.TIMETABLE_MANAGE),
  validateRequest({ body: validators.createEntrySchema }),
  controller.create);
router.patch('/timetable/entries/:entryId',
  requirePermissions(PERMISSIONS.TIMETABLE_MANAGE),
  validateRequest({ params: validators.entryParamsSchema, body: validators.updateEntrySchema }),
  controller.update);
router.patch('/timetable/entries/:entryId/publish',
  requirePermissions(PERMISSIONS.TIMETABLE_MANAGE),
  validateRequest({ params: validators.entryParamsSchema }),
  controller.publish);
router.patch('/timetable/entries/:entryId/archive',
  requirePermissions(PERMISSIONS.TIMETABLE_MANAGE),
  validateRequest({ params: validators.entryParamsSchema }),
  controller.archive);

router.get('/admin/timetable/class/:classId/section/:sectionId',
  requirePermissions(PERMISSIONS.TIMETABLE_MANAGE),
  validateRequest({ params: validators.classParamsSchema, query: validators.listQuerySchema }),
  controller.listClass);
router.get('/admin/timetable/entries',
  requirePermissions(PERMISSIONS.TIMETABLE_MANAGE),
  validateRequest({ query: validators.listQuerySchema }),
  controller.listAdmin);

router.get('/timetable/me',
  requirePermissions(PERMISSIONS.TIMETABLE_VIEW),
  validateRequest({ query: validators.listQuerySchema }),
  controller.listMe);
router.get('/timetable/teacher/me',
  requirePermissions(PERMISSIONS.TIMETABLE_VIEW),
  validateRequest({ query: validators.listQuerySchema }),
  controller.listTeacher);
router.get('/timetable/child/:studentId',
  requirePermissions(PERMISSIONS.TIMETABLE_VIEW),
  validateRequest({ params: validators.studentParamsSchema, query: validators.listQuerySchema }),
  controller.listParentChild);

module.exports = router;
