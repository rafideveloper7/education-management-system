const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermissions } = require('../authorization/middleware/permission.middleware');
const { PERMISSIONS } = require('../authorization/constants/permissions.constants');
const { validateRequest } = require('../middleware/validateRequest.middleware');
const validators = require('../validators/examination/examination.validator');
const controller = require('../controllers/examination.controller');

const router = express.Router();
router.use(authenticate);

router.post('/admin/exams',
  requirePermissions(PERMISSIONS.ACADEMIC_MANAGE),
  validateRequest({ body: validators.examCreateSchema }),
  controller.createExam);
router.get('/admin/exams',
  requirePermissions(PERMISSIONS.ACADEMIC_MANAGE),
  validateRequest({ query: validators.examListQuerySchema }),
  controller.listExams);
router.get('/admin/exams/:examId',
  requirePermissions(PERMISSIONS.ACADEMIC_MANAGE),
  validateRequest({ params: validators.examParamsSchema }),
  controller.getExam);
router.patch('/admin/exams/:examId',
  requirePermissions(PERMISSIONS.ACADEMIC_MANAGE),
  validateRequest({ params: validators.examParamsSchema, body: validators.examUpdateSchema }),
  controller.updateExam);
router.patch('/admin/exams/:examId/status',
  requirePermissions(PERMISSIONS.ACADEMIC_MANAGE),
  validateRequest({ params: validators.examParamsSchema, body: validators.examStatusSchema }),
  controller.changeExamStatus);
router.post('/admin/exams/:examId/schedules',
  requirePermissions(PERMISSIONS.ACADEMIC_MANAGE),
  validateRequest({ params: validators.examParamsSchema, body: validators.scheduleCreateSchema }),
  controller.createSchedule);
router.get('/admin/exams/:examId/schedules',
  requirePermissions(PERMISSIONS.ACADEMIC_MANAGE),
  validateRequest({ params: validators.examParamsSchema, query: validators.scheduleListQuerySchema }),
  controller.listSchedules);
router.patch('/admin/exam-schedules/:scheduleId',
  requirePermissions(PERMISSIONS.ACADEMIC_MANAGE),
  validateRequest({ params: validators.scheduleParamsSchema, body: validators.scheduleUpdateSchema }),
  controller.updateSchedule);

router.post('/admin/grade-scales',
  requirePermissions(PERMISSIONS.ACADEMIC_MANAGE),
  validateRequest({ body: validators.gradeScaleCreateSchema }),
  controller.createGradeScale);
router.get('/admin/grade-scales',
  requirePermissions(PERMISSIONS.ACADEMIC_MANAGE),
  validateRequest({ query: validators.gradeScaleListQuerySchema }),
  controller.listGradeScales);
router.get('/admin/grade-scales/:gradeScaleId',
  requirePermissions(PERMISSIONS.ACADEMIC_MANAGE),
  validateRequest({ params: validators.gradeScaleParamsSchema }),
  controller.getGradeScale);
router.patch('/admin/grade-scales/:gradeScaleId',
  requirePermissions(PERMISSIONS.ACADEMIC_MANAGE),
  validateRequest({ params: validators.gradeScaleParamsSchema, body: validators.gradeScaleUpdateSchema }),
  controller.updateGradeScale);

router.get('/teacher/exams',
  requirePermissions(PERMISSIONS.RESULT_VIEW),
  validateRequest({ query: validators.examListQuerySchema }),
  controller.listTeacherExams);
router.get('/teacher/exams/:examId/schedules',
  requirePermissions(PERMISSIONS.RESULT_VIEW),
  validateRequest({ params: validators.examParamsSchema, query: validators.scheduleListQuerySchema }),
  controller.listTeacherExamSchedules);
router.get('/teacher/exam-schedules/:scheduleId/students',
  requirePermissions(PERMISSIONS.RESULT_VIEW),
  validateRequest({ params: validators.scheduleParamsSchema }),
  controller.listEligibleStudents);
router.get('/teacher/exam-schedules/:scheduleId/marks',
  requirePermissions(PERMISSIONS.RESULT_VIEW),
  validateRequest({ params: validators.scheduleParamsSchema, query: validators.scheduleListQuerySchema }),
  controller.listMarks);
router.put('/teacher/exam-schedules/:scheduleId/marks',
  requirePermissions(PERMISSIONS.RESULT_ENTER),
  validateRequest({ params: validators.scheduleParamsSchema, body: validators.markBatchSchema }),
  controller.enterMarks);
router.get('/teacher/exams/:examId/results',
  requirePermissions(PERMISSIONS.RESULT_VIEW),
  validateRequest({ params: validators.examParamsSchema, query: validators.resultListQuerySchema }),
  controller.listExamResults);

router.post('/exams/:examId/results/calculate',
  requirePermissions(PERMISSIONS.EXAM_RESULTS_CALCULATE),
  validateRequest({ params: validators.examParamsSchema }),
  controller.calculateResults);
router.post('/exams/:examId/results/finalize',
  requirePermissions(PERMISSIONS.EXAM_RESULTS_FINALIZE),
  validateRequest({ params: validators.examParamsSchema }),
  controller.finalizeResults);
router.post('/exams/:examId/results/publish',
  requirePermissions(PERMISSIONS.RESULT_PUBLISH),
  validateRequest({ params: validators.examParamsSchema }),
  controller.publishResults);
router.get('/exams/:examId/results',
  requirePermissions(PERMISSIONS.RESULT_VIEW),
  validateRequest({ params: validators.examParamsSchema, query: validators.resultListQuerySchema }),
  controller.listExamResults);
router.get('/results/:resultId',
  requirePermissions(PERMISSIONS.RESULT_VIEW),
  validateRequest({ params: validators.resultParamsSchema }),
  controller.getExamResult);
router.post('/results/:resultId/corrections',
  requirePermissions(PERMISSIONS.EXAM_RESULTS_CORRECT),
  validateRequest({ params: validators.resultParamsSchema, body: validators.correctionSchema }),
  controller.correctPublishedResult);

router.get('/student/exams',
  requirePermissions(PERMISSIONS.RESULT_VIEW),
  controller.listOwnExams);
router.get('/student/results',
  requirePermissions(PERMISSIONS.RESULT_VIEW),
  validateRequest({ query: validators.studentResultListQuerySchema }),
  controller.listOwnResults);
router.get('/student/results/:resultId',
  requirePermissions(PERMISSIONS.RESULT_VIEW),
  validateRequest({ params: validators.resultParamsSchema }),
  controller.getOwnResult);

router.get('/parent/children/:studentUserId/exams',
  requirePermissions(PERMISSIONS.RESULT_VIEW),
  validateRequest({ params: validators.studentParamsSchema }),
  controller.listChildExams);
router.get('/parent/children/:studentUserId/results',
  requirePermissions(PERMISSIONS.RESULT_VIEW),
  validateRequest({
    params: validators.studentParamsSchema,
    query: validators.studentResultListQuerySchema,
  }),
  controller.listChildResults);

module.exports = router;
