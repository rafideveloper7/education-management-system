const express = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermissions } = require('../../authorization/middleware/permission.middleware');
const { PERMISSIONS } = require('../../authorization/constants/permissions.constants');
const { validateRequest } = require('../../middleware/validateRequest.middleware');
const validators = require('../../validators/academic/academic.validator');
const controller = require('../../controllers/admin/academic.controller');

const router = express.Router();
router.use(authenticate, requirePermissions(PERMISSIONS.ACADEMIC_MANAGE));

const registerResourceRoutes = (path, handlers, schemas) => {
  router.post(`/${path}`, validateRequest({ body: schemas.create }), handlers.create);
  router.get(`/${path}`, validateRequest({ query: schemas.list }), handlers.list);
  router.get(`/${path}/:recordId`, validateRequest({ params: validators.recordParamsSchema }), handlers.get);
  router.patch(`/${path}/:recordId`, validateRequest({
    params: validators.recordParamsSchema,
    body: schemas.update,
  }), handlers.update);
};

registerResourceRoutes('sessions', {
  create: controller.createSession,
  list: controller.listSessions,
  get: controller.getSession,
  update: controller.updateSession,
}, { create: validators.sessionCreateSchema, list: validators.sessionListSchema, update: validators.sessionUpdateSchema });
router.patch('/sessions/:recordId/status', validateRequest({
  params: validators.recordParamsSchema,
  body: validators.sessionStatusSchema,
}), controller.changeSessionStatus);

registerResourceRoutes('classes', {
  create: controller.createClass,
  list: controller.listClasses,
  get: controller.getClass,
  update: controller.updateClass,
}, { create: validators.classCreateSchema, list: validators.classListSchema, update: validators.classUpdateSchema });
registerResourceRoutes('sections', {
  create: controller.createSection,
  list: controller.listSections,
  get: controller.getSection,
  update: controller.updateSection,
}, { create: validators.sectionCreateSchema, list: validators.sectionListSchema, update: validators.sectionUpdateSchema });
registerResourceRoutes('subjects', {
  create: controller.createSubject,
  list: controller.listSubjects,
  get: controller.getSubject,
  update: controller.updateSubject,
}, { create: validators.subjectCreateSchema, list: validators.subjectListSchema, update: validators.subjectUpdateSchema });
registerResourceRoutes('class-subjects', {
  create: controller.createClassSubject,
  list: controller.listClassSubjects,
  get: controller.getClassSubject,
  update: controller.updateClassSubject,
}, {
  create: validators.classSubjectCreateSchema,
  list: validators.classSubjectListSchema,
  update: validators.classSubjectUpdateSchema,
});

module.exports = router;