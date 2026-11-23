const Result = require('../../models/examination/Result');
const GradeScale = require('../../models/examination/GradeScale');
const Exam = require('../../models/examination/Exam');
const ExamSchedule = require('../../models/examination/ExamSchedule');
const Mark = require('../../models/examination/Mark');
const ExamAudit = require('../../models/examination/ExamAudit');
const AcademicSession = require('../../models/academic/AcademicSession');
const ApiError = require('../../utils/ApiError');
const { PERMISSIONS } = require('../../authorization/constants/permissions.constants');
const {
  requireObjectId,
  assertPermission,
  runInTransaction,
  acquireWriteLock,
  roundPercentage,
  validateGradeBands,
  gradeForPercentage,
  decodeCursor,
  encodeCursor,
} = require('./examination.helpers');
const examService = require('./exam.service');

const createResultService = ({
  models = { Result, GradeScale, Exam, ExamSchedule, Mark, ExamAudit, AcademicSession },
  examinations = examService,
  transaction = runInTransaction,
  now = () => new Date(),
} = {}) => {
  const getGradeScale = async (academicSessionId, session) => {
    let query = models.GradeScale.findOne({ academicSessionId });
    if (session) query = query.session(session);
    const scale = await query.lean();
    if (!scale) throw new ApiError(409, 'A grading scale must be configured before calculating results', {
      code: 'GRADE_SCALE_NOT_CONFIGURED',
    });
    return scale;
  };

  const lockGradeScale = async (academicSessionId, session) => acquireWriteLock({
    Model: models.GradeScale,
    filter: { academicSessionId },
    field: 'workflowRevision',
    session,
    message: 'A grading scale must be configured before calculating results',
    code: 'GRADE_SCALE_NOT_CONFIGURED',
  });

  const createGradeScale = async ({ actor, payload }) => {
    requireObjectId(actor?.sub, 'authenticated user');
    assertPermission(actor, PERMISSIONS.ACADEMIC_MANAGE);
    requireObjectId(payload.academicSessionId, 'academicSessionId');
    const academicSession = await models.AcademicSession.findById(payload.academicSessionId).lean();
    if (!academicSession || !['PLANNED', 'ACTIVE'].includes(academicSession.status)) {
      throw new ApiError(400, 'Grade scales require a planned or active academic session', {
        code: 'INVALID_ACADEMIC_SESSION',
      });
    }
    const gradeBands = validateGradeBands(payload.gradeBands);
    return transaction(async (session) => {
      const [gradeScale] = await models.GradeScale.create([{
        ...payload,
        gradeBands,
        createdBy: actor.sub,
        updatedBy: actor.sub,
      }], { session });
      await models.ExamAudit.create([{
        resourceType: 'GRADE_SCALE',
        resourceId: gradeScale._id,
        actorUserId: actor.sub,
        action: 'GRADE_SCALE_CREATED',
        nextValue: { name: gradeScale.name, academicSessionId: gradeScale.academicSessionId, gradeBands },
      }], { session });
      return gradeScale;
    });
  };

  const getGradeScaleById = async (gradeScaleId) => {
    requireObjectId(gradeScaleId, 'gradeScaleId');
    const scale = await models.GradeScale.findById(gradeScaleId).lean();
    if (!scale) throw new ApiError(404, 'Grade scale not found', { code: 'GRADE_SCALE_NOT_FOUND' });
    return scale;
  };

  const listGradeScales = async (filters) => {
    const query = {};
    if (filters.academicSessionId) query.academicSessionId = filters.academicSessionId;
    if (filters.cursor) {
      const cursor = decodeCursor(filters.cursor);
      query.$or = [
        { createdAt: { $lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
      ];
    }
    const records = await models.GradeScale.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(filters.limit + 1)
      .lean();
    const hasMore = records.length > filters.limit;
    const items = hasMore ? records.slice(0, filters.limit) : records;
    return {
      items,
      pagination: {
        limit: filters.limit,
        hasMore,
        nextCursor: hasMore ? encodeCursor(items[items.length - 1]) : null,
      },
    };
  };

  const updateGradeScale = async ({ actor, gradeScaleId, payload }) => {
    requireObjectId(actor?.sub, 'authenticated user');
    assertPermission(actor, PERMISSIONS.ACADEMIC_MANAGE);
    const current = await getGradeScaleById(gradeScaleId);
    const gradeBands = payload.gradeBands
      ? validateGradeBands(payload.gradeBands)
      : current.gradeBands;
    return transaction(async (session) => {
      await lockGradeScale(current.academicSessionId, session);
      let resultExistsQuery = models.Result.exists({ academicSessionId: current.academicSessionId });
      if (session) resultExistsQuery = resultExistsQuery.session(session);
      if (await resultExistsQuery) {
        throw new ApiError(409, 'A grade scale cannot change after results have been calculated', {
          code: 'GRADE_SCALE_IN_USE',
        });
      }
      const gradeScale = await models.GradeScale.findByIdAndUpdate(
        current._id,
        { $set: { ...payload, gradeBands, updatedBy: actor.sub } },
        { new: true, runValidators: true, session },
      );
      if (!gradeScale) throw new ApiError(404, 'Grade scale not found', { code: 'GRADE_SCALE_NOT_FOUND' });
      await models.ExamAudit.create([{
        resourceType: 'GRADE_SCALE',
        resourceId: gradeScale._id,
        actorUserId: actor.sub,
        action: 'GRADE_SCALE_UPDATED',
        previousValue: { name: current.name, calculateOverallGrade: current.calculateOverallGrade, gradeBands: current.gradeBands },
        nextValue: { name: gradeScale.name, calculateOverallGrade: gradeScale.calculateOverallGrade, gradeBands: gradeScale.gradeBands },
      }], { session });
      return gradeScale;
    });
  };

  const collectResultRows = async ({ exam, studentUserId, session }) => {
    const gradeScale = await getGradeScale(exam.academicSessionId, session);
    const gradeBands = validateGradeBands(gradeScale.gradeBands);
    let scheduleQuery = models.ExamSchedule.find({ examId: exam._id }).sort({ startAt: 1, _id: 1 });
    if (session) scheduleQuery = scheduleQuery.session(session);
    const schedules = await scheduleQuery.lean();
    if (schedules.length === 0) throw new ApiError(409, 'Examination has no subject schedules', {
      code: 'EXAM_SCHEDULE_REQUIRED',
    });

    const resultByStudent = new Map();
    for (const schedule of schedules) {
      const enrollments = await examinations.validEnrollmentsForSchedule(schedule, session);
      const eligible = studentUserId
        ? enrollments.filter((enrollment) => String(enrollment.studentUserId) === String(studentUserId))
        : enrollments;
      if (studentUserId && eligible.length > 1) {
        throw new ApiError(409, 'Student has multiple eligible enrollments for one examination schedule', {
          code: 'AMBIGUOUS_STUDENT_ENROLLMENT',
        });
      }
      const eligibleStudentIds = eligible.map(({ studentUserId: id }) => String(id));
      if (new Set(eligibleStudentIds).size !== eligibleStudentIds.length) {
        throw new ApiError(409, 'Student has multiple eligible enrollments for one examination schedule', {
          code: 'AMBIGUOUS_STUDENT_ENROLLMENT',
        });
      }
      if (eligible.length === 0) continue;
      const eligibleIds = eligible.map((enrollment) => enrollment.studentUserId);
      let marksQuery = models.Mark.find({
        examScheduleId: schedule._id,
        studentUserId: studentUserId || { $in: eligibleIds },
      });
      if (session) marksQuery = marksQuery.session(session);
      const marks = await marksQuery.lean();
      const markByStudent = new Map(marks.map((mark) => [String(mark.studentUserId), mark]));

      for (const enrollment of eligible) {
        const mark = markByStudent.get(String(enrollment.studentUserId));
        if (!mark) {
          throw new ApiError(409, 'Every eligible student must have marks or an explicit absent status', {
            code: 'EXAM_MARKS_INCOMPLETE',
            details: [{ field: 'examScheduleId', message: 'Missing marks for an eligible student' }],
          });
        }
        if (String(mark.enrollmentId) !== String(enrollment._id)) {
          throw new ApiError(409, 'Marks do not match the student current eligible enrollment', {
            code: 'MARK_ENROLLMENT_MISMATCH',
          });
        }
        const obtainedMarks = mark.status === 'ABSENT' ? 0 : mark.obtainedMarks;
        if (!Number.isInteger(obtainedMarks) || obtainedMarks < 0 || obtainedMarks > schedule.maximumMarks) {
          throw new ApiError(409, 'Stored marks are invalid for the configured schedule maximum', {
            code: 'INVALID_STORED_MARKS',
          });
        }
        const rawPercentage = (obtainedMarks / schedule.maximumMarks) * 100;
        const percentage = roundPercentage(rawPercentage);
        const subjectGrade = gradeForPercentage(rawPercentage, gradeBands);
        let studentResult = resultByStudent.get(String(enrollment.studentUserId));
        if (!studentResult) {
          studentResult = {
            examId: exam._id,
            academicSessionId: exam.academicSessionId,
            studentUserId: enrollment.studentUserId,
            enrollmentId: enrollment._id,
            gradeScaleId: gradeScale._id,
            gradeScaleSnapshot: gradeBands.map((band) => ({ ...band })),
            subjects: [],
            totalObtainedMarks: 0,
            totalMaximumMarks: 0,
            overallPercentage: 0,
            overallGrade: null,
            overallPassing: null,
          };
          resultByStudent.set(String(enrollment.studentUserId), studentResult);
        } else if (String(studentResult.enrollmentId) !== String(enrollment._id)) {
          throw new ApiError(409, 'Student has inconsistent enrollments across examination schedules', {
            code: 'AMBIGUOUS_STUDENT_ENROLLMENT',
          });
        }
        studentResult.subjects.push({
          examScheduleId: schedule._id,
          subjectId: schedule.subjectId,
          status: mark.status,
          obtainedMarks,
          maximumMarks: schedule.maximumMarks,
          percentage,
          grade: subjectGrade.grade,
          isPassing: subjectGrade.isPassing,
        });
        studentResult.totalObtainedMarks += obtainedMarks;
        studentResult.totalMaximumMarks += schedule.maximumMarks;
      }
    }

    if (studentUserId && !resultByStudent.has(String(studentUserId))) {
      throw new ApiError(404, 'Student is not eligible for this examination', {
        code: 'STUDENT_NOT_ELIGIBLE',
      });
    }
    if (resultByStudent.size === 0) {
      throw new ApiError(409, 'There are no eligible students for this examination', {
        code: 'NO_ELIGIBLE_STUDENTS',
      });
    }
    for (const studentResult of resultByStudent.values()) {
      if (studentResult.totalMaximumMarks <= 0) {
        throw new ApiError(409, 'Result must include at least one scheduled subject', {
          code: 'INVALID_RESULT_TOTAL',
        });
      }
      const rawOverallPercentage = (
        studentResult.totalObtainedMarks / studentResult.totalMaximumMarks
      ) * 100;
      studentResult.overallPercentage = roundPercentage(rawOverallPercentage);
      if (gradeScale.calculateOverallGrade) {
        const overallGrade = gradeForPercentage(rawOverallPercentage, gradeBands);
        studentResult.overallGrade = overallGrade.grade;
        studentResult.overallPassing = overallGrade.isPassing;
      }
    }
    return [...resultByStudent.values()];
  };

  const calculateResults = async ({ actor, examId }) => {
    requireObjectId(actor?.sub, 'authenticated user');
    assertPermission(actor, PERMISSIONS.EXAM_RESULTS_CALCULATE);
    requireObjectId(examId, 'examId');
    const exam = await examinations.getExam(examId);
    if (!['COMPLETED', 'RESULTS_READY'].includes(exam.status)) {
      throw new ApiError(409, 'Results can only be calculated after the examination is completed', {
        code: 'EXAM_NOT_COMPLETED',
      });
    }
    return transaction(async (session) => {
      await examinations.lockExamWorkflow(exam._id, session);
      const currentExam = await examinations.getExam(exam._id, session);
      if (!['COMPLETED', 'RESULTS_READY'].includes(currentExam.status)) {
        throw new ApiError(409, 'Results can only be calculated after the examination is completed', {
          code: 'EXAM_NOT_COMPLETED',
        });
      }
      await lockGradeScale(currentExam.academicSessionId, session);
      const rows = await collectResultRows({ exam: currentExam, session });
      const studentIds = rows.map(({ studentUserId }) => studentUserId);
      let existingQuery = models.Result.find({ examId: exam._id });
      if (session) existingQuery = existingQuery.session(session);
      const existingResults = await existingQuery.lean();
      if (existingResults.some(({ status }) => status !== 'DRAFT')) {
        throw new ApiError(409, 'Finalized results must use the controlled correction workflow', {
          code: 'RESULTS_ALREADY_FINALIZED',
        });
      }

      const savedResults = [];
      for (const row of rows) {
        const result = await models.Result.findOneAndUpdate(
          { examId: exam._id, studentUserId: row.studentUserId, status: 'DRAFT' },
          {
            $set: { ...row, status: 'DRAFT', finalizedAt: null, publishedAt: null },
            $setOnInsert: { correctionCount: 0 },
          },
          { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true, session },
        );
        savedResults.push(result);
      }
      await models.Result.deleteMany({
        examId: exam._id,
        status: 'DRAFT',
        studentUserId: { $nin: studentIds },
      }, { session });
      await models.ExamAudit.create([{
        resourceType: 'RESULT',
        resourceId: exam._id,
        examId: exam._id,
        actorUserId: actor.sub,
        action: 'RESULTS_CALCULATED',
        nextValue: { resultCount: savedResults.length },
      }], { session });
      return savedResults;
    });
  };

  const finalizeResults = async ({ actor, examId }) => {
    requireObjectId(actor?.sub, 'authenticated user');
    assertPermission(actor, PERMISSIONS.EXAM_RESULTS_FINALIZE);
    requireObjectId(examId, 'examId');
    const exam = await examinations.getExam(examId);
    if (exam.status !== 'RESULTS_READY') {
      throw new ApiError(409, 'Examination must be marked results-ready before finalization', {
        code: 'EXAM_NOT_RESULTS_READY',
      });
    }
    return transaction(async (session) => {
      await examinations.lockExamWorkflow(exam._id, session);
      const currentExam = await examinations.getExam(exam._id, session);
      if (currentExam.status !== 'RESULTS_READY') {
        throw new ApiError(409, 'Examination must be marked results-ready before finalization', {
          code: 'EXAM_NOT_RESULTS_READY',
        });
      }
      await lockGradeScale(currentExam.academicSessionId, session);
      const rows = await collectResultRows({ exam: currentExam, session });
      const nowValue = now();
      const savedResults = [];
      let changedCount = 0;
      for (const row of rows) {
        const currentQuery = models.Result.findOne({
          examId: exam._id,
          studentUserId: row.studentUserId,
        });
        const current = await (session ? currentQuery.session(session) : currentQuery).lean();
        if (current && current.status !== 'DRAFT') {
          savedResults.push(current);
          continue;
        }
        const result = await models.Result.findOneAndUpdate(
          { examId: exam._id, studentUserId: row.studentUserId, status: 'DRAFT' },
          { $set: { ...row, status: 'FINALIZED', finalizedAt: nowValue, publishedAt: null } },
          { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true, session },
        );
        savedResults.push(result);
        changedCount += 1;
      }
      const finalizedIds = savedResults.map(({ _id }) => _id);
      await models.Result.deleteMany({
        examId: exam._id,
        status: 'DRAFT',
        _id: { $nin: finalizedIds },
      }, { session });
      if (changedCount > 0) {
        await models.ExamAudit.create([{
          resourceType: 'RESULT',
          resourceId: exam._id,
          examId: exam._id,
          actorUserId: actor.sub,
          action: 'RESULTS_FINALIZED',
          nextValue: { resultCount: savedResults.length },
        }], { session });
      }
      return savedResults;
    });
  };

  const calculateStudentResult = async ({ examId, studentUserId, session }) => {
    const exam = await examinations.getExam(examId, session);
    const [row] = await collectResultRows({ exam, studentUserId, session });
    return row;
  };

  return {
    getGradeScale,
    lockGradeScale,
    createGradeScale,
    getGradeScaleById,
    listGradeScales,
    updateGradeScale,
    calculateResults,
    finalizeResults,
    calculateStudentResult,
    collectResultRows,
  };
};

module.exports = { ...createResultService(), createResultService };
