const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermissions } = require('../authorization/middleware/permission.middleware');
const { PERMISSIONS } = require('../authorization/constants/permissions.constants');
const { validateRequest } = require('../middleware/validateRequest.middleware');
const { receiveDocument } = require('../middleware/document-upload.middleware');
const validators = require('../validators/document.validator');
const controller = require('../controllers/document.controller');

const router = express.Router();
router.use(authenticate);

router.post('/documents',
  requirePermissions(PERMISSIONS.DOCUMENT_MANAGE),
  receiveDocument,
  validateRequest({ body: validators.uploadDocumentSchema }),
  controller.upload);
router.get('/documents',
  requirePermissions(PERMISSIONS.DOCUMENT_READ),
  validateRequest({ query: validators.documentListQuerySchema }),
  controller.list);
router.get('/documents/:documentId',
  requirePermissions(PERMISSIONS.DOCUMENT_READ),
  validateRequest({ params: validators.documentIdParamsSchema }),
  controller.getById);
router.get('/documents/:documentId/download',
  requirePermissions(PERMISSIONS.DOCUMENT_READ),
  validateRequest({ params: validators.documentIdParamsSchema }),
  controller.download);
router.patch('/documents/:documentId/archive',
  requirePermissions(PERMISSIONS.DOCUMENT_READ),
  validateRequest({ params: validators.documentIdParamsSchema }),
  controller.archive);

router.get('/documents/existing/admission',
  requirePermissions(PERMISSIONS.DOCUMENT_MANAGE),
  validateRequest({ query: validators.paginationQuerySchema }),
  controller.listAdmission);
router.get('/documents/existing/admission/:documentId/download',
  requirePermissions(PERMISSIONS.DOCUMENT_MANAGE),
  validateRequest({ params: validators.existingAdmissionParamsSchema }),
  controller.downloadAdmission);
router.get('/documents/existing/assignment',
  requirePermissions(PERMISSIONS.DOCUMENT_MANAGE),
  validateRequest({ query: validators.paginationQuerySchema }),
  controller.listAssignment);
router.get('/documents/existing/assignment/attachments/:assignmentId/:fileId/download',
  requirePermissions(PERMISSIONS.DOCUMENT_MANAGE),
  validateRequest({ params: validators.existingAssignmentAttachmentParamsSchema }),
  controller.downloadAssignmentAttachment);
router.get('/documents/existing/assignment/submissions/:submissionId/download',
  requirePermissions(PERMISSIONS.DOCUMENT_MANAGE),
  validateRequest({ params: validators.existingAssignmentSubmissionParamsSchema }),
  controller.downloadAssignmentSubmission);

module.exports = router;
