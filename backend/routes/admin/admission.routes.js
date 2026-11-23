// Admin Admission Routes
// Section 5.3, 5.5-5.6, 5.10: Admin admission management

const express = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermissions } = require('../../authorization/middleware/permission.middleware');
const { PERMISSIONS } = require('../../authorization/constants/permissions.constants');
const { validateRequest } = require('../../middleware/validateRequest.middleware');
const controller = require('../../controllers/admission/admin.controller');

// Import validators
const v = require('../../validators/admission/admission.validator');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// ── Configuration Management ─────────────────────────────────────────────────
router.post('/admission/configurations',
  requirePermissions(PERMISSIONS.ADMISSION_CONFIG_MANAGE),
  validateRequest({ body: v.createAdmissionConfigurationSchema }),
  controller.createConfiguration);

router.patch('/admission/configurations/:configurationId',
  requirePermissions(PERMISSIONS.ADMISSION_CONFIG_MANAGE),
  validateRequest({ params: v.configurationParamsSchema, body: v.updateAdmissionConfigurationSchema }),
  controller.updateConfiguration);

router.delete('/admission/configurations/:configurationId/archive',
  requirePermissions(PERMISSIONS.ADMISSION_CONFIG_MANAGE),
  validateRequest({ params: v.configurationParamsSchema }),
  controller.archiveConfiguration);

// ── Application Management ───────────────────────────────────────────────────
router.get('/admission/applications',
  requirePermissions(PERMISSIONS.ADMISSION_APPLICATION_VIEW),
  validateRequest({ query: v.applicationListQuerySchema }),
  controller.listApplications);

router.get('/admission/applications/:applicationId',
  requirePermissions(PERMISSIONS.ADMISSION_APPLICATION_VIEW),
  validateRequest({ params: v.applicationParamsSchema }),
  controller.getApplicationDetails);

// ── Document Management ──────────────────────────────────────────────────────
router.patch('/admission/documents/:documentId/verify',
  requirePermissions(PERMISSIONS.ADMISSION_DOCUMENT_VIEW),
  validateRequest({ params: v.documentParamsSchema, body: v.verifyDocumentSchema }),
  controller.verifyDocument);

router.get('/admission/documents/:documentId',
  requirePermissions(PERMISSIONS.ADMISSION_DOCUMENT_VIEW),
  validateRequest({ params: v.documentParamsSchema }),
  controller.getDocumentDetails);

// ── Workflow Management ──────────────────────────────────────────────────────
router.post('/admission/applications/:applicationId/start-review',
  requirePermissions(PERMISSIONS.ADMISSION_REVIEW_CREATE),
  validateRequest({ params: v.applicationParamsSchema, body: v.startReviewSchema }),
  controller.startReview);

router.post('/admission/applications/:applicationId/request-more-info',
  requirePermissions(PERMISSIONS.ADMISSION_REVIEW_CREATE),
  validateRequest({ params: v.applicationParamsSchema, body: v.requestMoreInfoSchema }),
  controller.requestMoreInfo);

router.post('/admission/applications/:applicationId/approve',
  requirePermissions(PERMISSIONS.ADMISSION_DECISION_APPROVE),
  validateRequest({ params: v.applicationParamsSchema, body: v.approveApplicationSchema }),
  controller.approveApplication);

router.post('/admission/applications/:applicationId/reject',
  requirePermissions(PERMISSIONS.ADMISSION_DECISION_REJECT),
  validateRequest({ params: v.applicationParamsSchema, body: v.rejectApplicationSchema }),
  controller.rejectApplication);

router.post('/admission/applications/:applicationId/complete-review',
  requirePermissions(PERMISSIONS.ADMISSION_REVIEW_CREATE),
  validateRequest({ params: v.applicationParamsSchema, body: v.completeReviewSchema }),
  controller.completeReview);

// ── Onboarding Management ────────────────────────────────────────────────────
router.post('/admission/applications/:applicationId/onboard',
  requirePermissions(PERMISSIONS.ADMISSION_STUDENT_ONBOARD),
  validateRequest({ params: v.applicationParamsSchema, body: v.onboardStudentSchema }),
  controller.onboardStudent);

router.post('/students/:studentId/link-parent',
  requirePermissions(PERMISSIONS.PARENT_STUDENT_MANAGE),
  validateRequest({ params: v.studentParamsSchema, body: v.linkParentSchema }),
  controller.linkParent);

router.post('/students/:studentId/enroll',
  requirePermissions(PERMISSIONS.STUDENT_ENROLLMENT_MANAGE),
  validateRequest({ params: v.studentParamsSchema, body: v.enrollStudentSchema }),
  controller.enrollStudent);

router.post('/admission/applications/:applicationId/complete-workflow',
  requirePermissions([PERMISSIONS.ADMISSION_STUDENT_ONBOARD, PERMISSIONS.PARENT_STUDENT_MANAGE, PERMISSIONS.STUDENT_ENROLLMENT_MANAGE]),
  validateRequest({ params: v.applicationParamsSchema, body: v.completeAdmissionWorkflowSchema }),
  controller.completeAdmissionWorkflow);

// ── Reports & Analytics ──────────────────────────────────────────────────────
router.get('/admission/dashboard/stats',
  requirePermissions(PERMISSIONS.ADMISSION_REPORT_VIEW),
  validateRequest({ query: v.dashboardStatsQuerySchema }),
  controller.getDashboardStats);

router.get('/admission/stats',
  requirePermissions(PERMISSIONS.ADMISSION_REPORT_VIEW),
  validateRequest({ query: v.applicationStatsQuerySchema }),
  controller.getApplicationStats);

router.get('/admission/applications/:applicationId/audit-trail',
  requirePermissions(PERMISSIONS.ADMISSION_HISTORY_VIEW),
  validateRequest({ params: v.applicationParamsSchema }),
  controller.getApplicationAuditTrail);

router.get('/admission/reports',
  requirePermissions(PERMISSIONS.ADMISSION_REPORT_VIEW),
  validateRequest({ query: v.admissionReportQuerySchema }),
  controller.generateAdmissionReport);

router.get('/admission/class-statistics',
  requirePermissions(PERMISSIONS.ADMISSION_REPORT_VIEW),
  validateRequest({ query: v.classStatisticsQuerySchema }),
  controller.getClassWiseStatistics);

router.get('/admission/trends',
  requirePermissions(PERMISSIONS.ADMISSION_REPORT_VIEW),
  validateRequest({ query: v.admissionTrendsQuerySchema }),
  controller.getAdmissionTrends);

// ── Utility Endpoints ────────────────────────────────────────────────────────
router.get('/admission/applications/:applicationId/completeness',
  requirePermissions(PERMISSIONS.ADMISSION_REVIEW_CREATE),
  validateRequest({ params: v.applicationParamsSchema }),
  controller.checkApplicationCompleteness);

router.get('/students/:studentId/onboarding-status',
  requirePermissions(PERMISSIONS.ADMISSION_STUDENT_ONBOARD),
  validateRequest({ params: v.studentParamsSchema }),
  controller.getOnboardingStatus);

module.exports = router;