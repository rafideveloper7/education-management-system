const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermissions } = require('../authorization/middleware/permission.middleware');
const { PERMISSIONS } = require('../authorization/constants/permissions.constants');
const { validateRequest } = require('../middleware/validateRequest.middleware');
const { receiveAssignmentFile } = require('../middleware/assignment-upload.middleware');
const validators = require('../validators/assignment/assignment.validator');
const controller = require('../controllers/assignment.controller');

const router = express.Router();
router.use(authenticate);

router.post('/teacher/assignments', requirePermissions(PERMISSIONS.ASSIGNMENT_CREATE),
  validateRequest({ body: validators.assignmentCreateSchema }), controller.create);
router.get('/teacher/assignments', requirePermissions(PERMISSIONS.ASSIGNMENT_VIEW),
  validateRequest({ query: validators.listQuerySchema }), controller.listTeacher);
router.get('/teacher/assignments/:assignmentId', requirePermissions(PERMISSIONS.ASSIGNMENT_VIEW),
  validateRequest({ params: validators.assignmentParamsSchema }), controller.getTeacher);
router.patch('/teacher/assignments/:assignmentId', requirePermissions(PERMISSIONS.ASSIGNMENT_UPDATE),
  validateRequest({ params: validators.assignmentParamsSchema, body: validators.assignmentUpdateSchema }), controller.update);
router.post('/teacher/assignments/:assignmentId/attachments', requirePermissions(PERMISSIONS.ASSIGNMENT_UPDATE),
  validateRequest({ params: validators.assignmentParamsSchema }), controller.preflightAttachment,
  receiveAssignmentFile('attachment'), controller.addAttachment);
router.post('/teacher/assignments/:assignmentId/publish', requirePermissions(PERMISSIONS.ASSIGNMENT_PUBLISH),
  validateRequest({ params: validators.assignmentParamsSchema }), controller.publish);
router.post('/teacher/assignments/:assignmentId/close', requirePermissions(PERMISSIONS.ASSIGNMENT_UPDATE),
  validateRequest({ params: validators.assignmentParamsSchema }), controller.close);
router.patch('/teacher/assignments/:assignmentId/deadline', requirePermissions(PERMISSIONS.ASSIGNMENT_DEADLINE_EXTEND),
  validateRequest({ params: validators.assignmentParamsSchema, body: validators.deadlineSchema }), controller.extendDeadline);
router.get('/teacher/assignments/:assignmentId/submissions', requirePermissions(PERMISSIONS.SUBMISSION_VIEW),
  validateRequest({ params: validators.assignmentParamsSchema, query: validators.listQuerySchema }), controller.listSubmissions);
router.get('/teacher/submissions/:submissionId', requirePermissions(PERMISSIONS.SUBMISSION_VIEW),
  validateRequest({ params: validators.submissionParamsSchema }), controller.getSubmission);

router.get('/student/assignments', requirePermissions(PERMISSIONS.ASSIGNMENT_VIEW),
  validateRequest({ query: validators.listQuerySchema }), controller.listStudent);
router.get('/student/assignments/:assignmentId', requirePermissions(PERMISSIONS.ASSIGNMENT_VIEW),
  validateRequest({ params: validators.assignmentParamsSchema }), controller.getStudent);
router.post('/student/assignments/:assignmentId/submissions', requirePermissions(PERMISSIONS.SUBMISSION_UPLOAD),
  validateRequest({ params: validators.assignmentParamsSchema }), controller.preflightSubmission,
  receiveAssignmentFile('submission'), controller.submit);
router.get('/student/submissions', requirePermissions(PERMISSIONS.SUBMISSION_VIEW),
  validateRequest({ query: validators.listQuerySchema }), controller.listOwnSubmissions);
router.get('/student/submissions/:submissionId', requirePermissions(PERMISSIONS.SUBMISSION_VIEW),
  validateRequest({ params: validators.submissionParamsSchema }), controller.getSubmission);
router.put('/student/submissions/:submissionId/file', requirePermissions(PERMISSIONS.SUBMISSION_REPLACE),
  validateRequest({ params: validators.submissionParamsSchema }), controller.preflightReplacement,
  receiveAssignmentFile('submission'), controller.replaceFile);

router.get('/files/assignments/:assignmentId/attachments/:fileId', requirePermissions(PERMISSIONS.ASSIGNMENT_VIEW),
  validateRequest({ params: validators.attachmentParamsSchema }), controller.getAttachmentFile);
router.get('/files/submissions/:submissionId', requirePermissions(PERMISSIONS.SUBMISSION_VIEW),
  validateRequest({ params: validators.submissionParamsSchema }), controller.getSubmissionFile);

module.exports = router;