const examService = require('../services/examination/exam.service');
const marksService = require('../services/examination/marks.service');
const resultService = require('../services/examination/result.service');
const resultPublishingService = require('../services/examination/resultPublishing.service');

const sendOk = (res, data, status = 200) => {
  if (data && Array.isArray(data.items) && data.pagination) {
    return res.status(status).json({ success: true, data: data.items, pagination: data.pagination });
  }
  return res.status(status).json({ success: true, data });
};

const wrap = (handler) => async (req, res, next) => {
  try {
    await handler(req, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExam: wrap(async (req, res) => sendOk(res, await examService.createExam({
    actor: req.user,
    payload: req.validated.body,
  }), 201)),
  listExams: wrap(async (req, res) => sendOk(res, await examService.listExams({
    actor: req.user,
    filters: req.validated.query,
  }))),
  getExam: wrap(async (req, res) => sendOk(res, await examService.getExamForActor({
    actor: req.user,
    examId: req.validated.params.examId,
  }))),
  updateExam: wrap(async (req, res) => sendOk(res, await examService.updateExam({
    actor: req.user,
    examId: req.validated.params.examId,
    payload: req.validated.body,
  }))),
  changeExamStatus: wrap(async (req, res) => sendOk(res, await examService.changeExamStatus({
    actor: req.user,
    examId: req.validated.params.examId,
    status: req.validated.body.status,
  }))),
  createSchedule: wrap(async (req, res) => sendOk(res, await examService.createSchedule({
    actor: req.user,
    examId: req.validated.params.examId,
    payload: req.validated.body,
  }), 201)),
  listSchedules: wrap(async (req, res) => sendOk(res, await examService.listSchedules({
    actor: req.user,
    examId: req.validated.params.examId,
    filters: req.validated.query,
  }))),
  updateSchedule: wrap(async (req, res) => sendOk(res, await examService.updateSchedule({
    actor: req.user,
    scheduleId: req.validated.params.scheduleId,
    payload: req.validated.body,
  }))),
  listTeacherExams: wrap(async (req, res) => sendOk(res, await examService.listTeacherExams({
    actor: req.user,
    filters: req.validated.query,
  }))),
  listTeacherExamSchedules: wrap(async (req, res) => sendOk(res, await examService.listTeacherExamSchedules({
    actor: req.user,
    examId: req.validated.params.examId,
    filters: req.validated.query,
  }))),
  listEligibleStudents: wrap(async (req, res) => sendOk(res, await examService.listEligibleStudents({
    actor: req.user,
    scheduleId: req.validated.params.scheduleId,
  }))),
  listMarks: wrap(async (req, res) => sendOk(res, await marksService.listMarks({
    actor: req.user,
    scheduleId: req.validated.params.scheduleId,
    filters: req.validated.query,
  }))),
  enterMarks: wrap(async (req, res) => sendOk(res, await marksService.enterMarks({
    actor: req.user,
    scheduleId: req.validated.params.scheduleId,
    records: req.validated.body.records,
  }))),
  createGradeScale: wrap(async (req, res) => sendOk(res, await resultService.createGradeScale({
    actor: req.user,
    payload: req.validated.body,
  }), 201)),
  listGradeScales: wrap(async (req, res) => sendOk(res, await resultService.listGradeScales(
    req.validated.query,
  ))),
  getGradeScale: wrap(async (req, res) => sendOk(res, await resultService.getGradeScaleById(
    req.validated.params.gradeScaleId,
  ))),
  updateGradeScale: wrap(async (req, res) => sendOk(res, await resultService.updateGradeScale({
    actor: req.user,
    gradeScaleId: req.validated.params.gradeScaleId,
    payload: req.validated.body,
  }))),
  calculateResults: wrap(async (req, res) => sendOk(res, await resultService.calculateResults({
    actor: req.user,
    examId: req.validated.params.examId,
  }))),
  finalizeResults: wrap(async (req, res) => sendOk(res, await resultService.finalizeResults({
    actor: req.user,
    examId: req.validated.params.examId,
  }))),
  publishResults: wrap(async (req, res) => sendOk(res, await resultPublishingService.publishResults({
    actor: req.user,
    examId: req.validated.params.examId,
  }))),
  listExamResults: wrap(async (req, res) => sendOk(res, await resultPublishingService.listExamResults({
    actor: req.user,
    examId: req.validated.params.examId,
    filters: req.validated.query,
  }))),
  getExamResult: wrap(async (req, res) => sendOk(res, await resultPublishingService.getExamResult({
    actor: req.user,
    resultId: req.validated.params.resultId,
  }))),
  listOwnExams: wrap(async (req, res) => sendOk(res, await resultPublishingService.listOwnExams({
    actor: req.user,
  }))),
  listOwnResults: wrap(async (req, res) => sendOk(res, await resultPublishingService.listOwnResults({
    actor: req.user,
    filters: req.validated.query,
  }))),
  getOwnResult: wrap(async (req, res) => sendOk(res, await resultPublishingService.getOwnResult({
    actor: req.user,
    resultId: req.validated.params.resultId,
  }))),
  listChildExams: wrap(async (req, res) => sendOk(res, await resultPublishingService.listChildExams({
    actor: req.user,
    studentUserId: req.validated.params.studentUserId,
  }))),
  listChildResults: wrap(async (req, res) => sendOk(res, await resultPublishingService.listChildResults({
    actor: req.user,
    studentUserId: req.validated.params.studentUserId,
    filters: req.validated.query,
  }))),
  correctPublishedResult: wrap(async (req, res) => sendOk(res, await resultPublishingService.correctPublishedResult({
    actor: req.user,
    resultId: req.validated.params.resultId,
    payload: req.validated.body,
  }))),
};
