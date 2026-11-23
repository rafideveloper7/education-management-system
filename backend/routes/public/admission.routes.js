// Public Admission Routes
// Section 5.2: Public admission endpoints

const express = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermissions } = require('../../authorization/middleware/permission.middleware');
const { PERMISSIONS } = require('../../authorization/constants/permissions.constants');
const { validateRequest } = require('../../middleware/validateRequest.middleware');
const { upload } = require('../../middleware/upload.middleware');
const controller = require('../../controllers/admission/public.controller');

// Import validators
const v = require('../../validators/admission/admission.validator');

const router = express.Router();

// ── Public Configuration ─────────────────────────────────────────────────────
router.get('/admission/configurations',
  validateRequest({ query: v.admissionConfigurationListQuerySchema }),
  controller.getActiveConfigurations);

router.get('/admission/configurations/:configurationId',
  validateRequest({ params: v.configurationParamsSchema }),
  controller.getConfigurationById);

// ── Application Creation & Management ────────────────────────────────────────
router.post('/admission/applications',
  validateRequest({ body: v.createAdmissionApplicationSchema }),
  controller.createDraftApplication);

router.post('/admission/applications/:applicationId/submit',
  validateRequest({ params: v.applicationParamsSchema }),
  controller.submitApplication);

router.get('/admission/applications/:applicationId',
  validateRequest({ params: v.applicationParamsSchema }),
  controller.getApplicationById);

router.patch('/admission/applications/:applicationId',
  authenticate,
  validateRequest({ params: v.applicationParamsSchema, body: v.updateAdmissionApplicationSchema }),
  controller.updateDraftApplication);

// ── Document Management ──────────────────────────────────────────────────────
router.post('/admission/applications/:applicationId/documents',
  authenticate,
  upload.single('document'),
  validateRequest({ params: v.applicationParamsSchema, body: v.uploadDocumentSchema }),
  controller.uploadDocument);

router.get('/admission/applications/:applicationId/documents',
  validateRequest({ params: v.applicationParamsSchema }),
  controller.getApplicationDocuments);

router.get('/admission/documents/:documentId',
  validateRequest({ params: v.documentParamsSchema }),
  controller.getDocumentById);

router.put('/admission/documents/:documentId',
  authenticate,
  upload.single('document'),
  validateRequest({ params: v.documentParamsSchema, body: v.replaceDocumentSchema }),
  controller.replaceDocument);

router.delete('/admission/documents/:documentId',
  authenticate,
  validateRequest({ params: v.documentParamsSchema }),
  controller.deleteDocument);

// ── Validation & Eligibility ─────────────────────────────────────────────────
router.post('/admission/configurations/:configurationId/check-eligibility',
  validateRequest({ params: v.configurationParamsSchema, body: v.checkEligibilitySchema }),
  controller.checkEligibility);

router.post('/admission/validate-application',
  validateRequest({ body: v.validateApplicationSchema }),
  controller.validateApplication);

module.exports = router;