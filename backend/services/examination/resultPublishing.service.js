const Result = require('../../models/examination/Result');
const Exam = require('../../models/examination/Exam');
const ExamSchedule = require('../../models/examination/ExamSchedule');
const Mark = require('../../models/examination/Mark');
const ExamAudit = require('../../models/examination/ExamAudit');
const StudentEnrollment = require('../../models/student/StudentEnrollment');
const ParentStudent = require('../../models/parent/ParentStudent');
const ApiError = require('../../utils/ApiError');
const { hasPermission } = require('../../authorization/services/permission.service');
const { PERMISSIONS } = require('../../authorization/constants/permissions.constants');
const {
  requireObjectId,
  assertPermission,
  encodeCursor,
  decodeCursor,
  runInTransaction,
} = require('./examination.helpers');
const examService = require('./exam.service');
const resultService = require('./result.service');

const createResultPublishingService = ({
  models = { Result, Exam, ExamSchedule, Mark, ExamAudit, StudentEnrollment, ParentStudent },
  examinations = examService,
  results = resultService,
  transaction = runInTransaction,
  now = () => new Date(),
} = {}) => {
  const requireStudentRole = (actor) => {
    requireObjectId(actor?.sub, 'authenticated user');
    assertPermission(actor, PERMISSIONS.RESULT_VIEW);
    if (actor.role !== 'STUDENT') throw new ApiError(403, 'Student access is required');
  };

  const requireParentRelationship = async ({ actor, studentUserId }) => {
    requireObjectId(actor?.sub, 'authenticated user');
    requireObjectId(studentUserId, 'studentUserId');
    assertPermission(actor, PERMISSIONS.RESULT_VIEW);
    if (actor.role !== 'PARENT') throw new ApiError(403, 'Parent access is required');
    const currentTime = now();
    const relationship = await models.ParentStudent.exists({
      parentUserId: actor.sub,
      studentUserId,
      status: 'ACTIVE',
      validFrom: { $lte: currentTime },
      $or: [{ validTo: null }, { validTo: { $gte: currentTime } }],
    });
    if (!relationship) throw new ApiError(403, 'Parent is not currently authorized to access this student', {
      code: 'PARENT_STUDENT_RELATIONSHIP_REQUIRED',
    });
  };

  const list = async (Model, filter, filters) => {
    const query = { ...filter };
    if (filters.cursor) {
      const cursor = decodeCursor(filters.cursor);
      query.$or = [
        { createdAt: { $lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
      ];
    }
    const records = await Model.find(query)
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

  const publishResults = async ({ actor, examId }) => {
    requireObjectId(actor?.sub, 'authenticated user');
    requireObjectId(examId, 'examId');
    if (!hasPermission(actor, PERMISSIONS.RESULT_PUBLISH)) {
      throw new ApiError(403, 'You do not have permission to publish examination results');
    }
    const exam = await examinations.getExam(examId);
    return transaction(async (session) => {
      await examinations.lockExamWorkflow(exam._id, session);
      const currentExam = await examinations.getExam(exam._id, session);
      if (currentExam.status !== 'RESULTS_READY') {
        throw new ApiError(409, 'Examination must be results-ready before publication', {
          code: 'EXAM_NOT_RESULTS_READY',
        });
      }
      await results.lockGradeScale(currentExam.academicSessionId, session);
      const rows = await results.collectResultRows({ exam: currentExam, session });
      const publishAt = now();
      const publishedResults = [];
      let changedCount = 0;
      for (const row of rows) {
        let currentQuery = models.Result.findOne({
          examId: currentExam._id,
          studentUserId: row.studentUserId,
        });
        if (session) currentQuery = currentQuery.session(session);
        const current = await currentQuery.lean();
        if (!current || !['FINALIZED', 'PUBLISHED'].includes(current.status)) {
          throw new ApiError(409, 'Every eligible result must be finalized before publication', {
            code: 'RESULTS_NOT_FINALIZED',
          });
        }
        if (current.status === 'PUBLISHED') {
          publishedResults.push(current);
          continue;
        }
        const published = await models.Result.findOneAndUpdate(
          { _id: current._id, status: 'FINALIZED' },
          { $set: { status: 'PUBLISHED', publishedAt: publishAt } },
          { new: true, runValidators: true, session },
        );
        if (!published) throw new ApiError(409, 'Result lifecycle changed during publication', {
          code: 'RESULT_PUBLICATION_CONFLICT',
        });
        publishedResults.push(published);
        changedCount += 1;
      }
      if (publishedResults.length === 0) {
        throw new ApiError(409, 'There are no eligible results to publish', {
          code: 'NO_RESULTS_TO_PUBLISH',
        });
      }
      if (changedCount > 0) {
        await models.ExamAudit.create([{
          resourceType: 'RESULT',
          resourceId: currentExam._id,
          examId: currentExam._id,
          actorUserId: actor.sub,
          action: 'RESULTS_PUBLISHED',
          nextValue: { resultCount: publishedResults.length, publishedAt: publishAt },
        }], { session });
      }
      return publishedResults;
    });
  };

  const listExamResults = async ({ actor, examId, filters }) => {
    const exam = await examinations.requireExamAccess(actor, examId);
    const query = { examId: exam._id };
    if (filters.studentUserId) query.studentUserId = filters.studentUserId;
    if (filters.status) query.status = filters.status;
    if (actor.role !== 'TEACHER') return list(models.Result, query, filters);

    const access = await getTeacherResultAccess(actor, exam);
    query.studentUserId = { $in: [...access.studentUserIds] };
    if (filters.studentUserId) query.studentUserId.$in = query.studentUserId.$in.filter(
      (studentUserId) => String(studentUserId) === String(filters.studentUserId)
    );
    const page = await list(models.Result, query, filters);
    return { ...page, items: page.items.map((result) => toTeacherResult(result, access.scheduleIds)) };
  };

  const getExamResult = async ({ actor, resultId }) => {
    requireObjectId(resultId, 'resultId');
    const result = await models.Result.findById(resultId).lean();
    if (!result) throw new ApiError(404, 'Examination result not found', { code: 'RESULT_NOT_FOUND' });
    let exam;
    try {
      exam = await examinations.requireExamAccess(actor, result.examId);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 403) {
        throw new ApiError(404, 'Examination result not found', { code: 'RESULT_NOT_FOUND' });
      }
      throw error;
    }
    if (actor.role !== 'TEACHER') return result;
    const access = await getTeacherResultAccess(actor, exam);
    if (!access.studentUserIds.has(String(result.studentUserId))) {
      throw new ApiError(404, 'Examination result not found', { code: 'RESULT_NOT_FOUND' });
    }
    const teacherResult = toTeacherResult(result, access.scheduleIds);
    if (teacherResult.subjects.length === 0) {
      throw new ApiError(404, 'Examination result not found', { code: 'RESULT_NOT_FOUND' });
    }
    return teacherResult;
  };

  const getTeacherResultAccess = async (actor, exam) => {
    const schedules = await models.ExamSchedule.find({ examId: exam._id }).lean();
    const authorizedSchedules = [];
    for (const schedule of schedules) {
      try {
        await examinations.assertScheduleAccess(actor, schedule);
        authorizedSchedules.push(schedule);
      } catch (error) {
        if (!(error instanceof ApiError) || error.statusCode !== 403) throw error;
      }
    }
    if (authorizedSchedules.length === 0) {
      throw new ApiError(403, 'Teacher is not assigned to an examination schedule');
    }
    const studentUserIds = new Set();
    for (const schedule of authorizedSchedules) {
      const enrollments = await examinations.validEnrollmentsForSchedule(schedule);
      enrollments.forEach(({ studentUserId }) => studentUserIds.add(String(studentUserId)));
    }
    return {
      scheduleIds: new Set(authorizedSchedules.map(({ _id }) => String(_id))),
      studentUserIds,
    };
  };

  const listOwnResults = async ({ actor, filters }) => {
    requireStudentRole(actor);
    const page = await list(models.Result, { studentUserId: actor.sub, status: 'PUBLISHED' }, filters);
    return { ...page, items: page.items.map(toStudentResult) };
  };

  const getOwnResult = async ({ actor, resultId }) => {
    requireStudentRole(actor);
    requireObjectId(resultId, 'resultId');
    const result = await models.Result.findOne({
      _id: resultId,
      studentUserId: actor.sub,
      status: 'PUBLISHED',
    }).lean();
    if (!result) throw new ApiError(404, 'Published examination result not found', {
      code: 'RESULT_NOT_FOUND',
    });
    return toStudentResult(result);
  };

  const listChildResults = async ({ actor, studentUserId, filters }) => {
    await requireParentRelationship({ actor, studentUserId });
    const page = await list(models.Result, { studentUserId, status: 'PUBLISHED' }, filters);
    return { ...page, items: page.items.map(toStudentResult) };
  };

  const listStudentExams = async ({ actor, studentUserId = actor?.sub }) => {
    requireObjectId(studentUserId, 'studentUserId');
    if (actor.role === 'STUDENT') {
      if (String(studentUserId) !== String(actor.sub)) {
        throw new ApiError(403, 'Students can only view their own examinations');
      }
    } else {
      await requireParentRelationship({ actor, studentUserId });
    }
    const currentTime = now();
    const enrollments = await models.StudentEnrollment.find({
      studentUserId,
      status: 'ACTIVE',
      validFrom: { $lte: currentTime },
      $or: [{ validTo: null }, { validTo: { $gte: currentTime } }],
    }).lean();
    if (enrollments.length === 0) return [];
    const scheduleQueries = enrollments.map((enrollment) => models.ExamSchedule.find({
      academicSessionId: enrollment.academicSessionId,
      classId: enrollment.classId,
      sectionId: enrollment.sectionId,
      endAt: { $gte: currentTime },
    }).lean());
    const schedules = (await Promise.all(scheduleQueries)).flat();
    if (schedules.length === 0) return [];
    const examIds = [...new Set(schedules.map(({ examId }) => String(examId)))];
    const exams = await models.Exam.find({
      _id: { $in: examIds },
      status: { $in: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'RESULTS_READY'] },
    }).lean();
    const examById = new Map(exams.map((exam) => [String(exam._id), exam]));
    return schedules
      .filter(({ examId }) => examById.has(String(examId)))
      .map((schedule) => ({
        scheduleId: schedule._id,
        examScheduleId: schedule._id,
        academicSessionId: schedule.academicSessionId,
        classId: schedule.classId,
        sectionId: schedule.sectionId,
        subjectId: schedule.subjectId,
        startAt: schedule.startAt,
        endAt: schedule.endAt,
        room: schedule.room,
        maximumMarks: schedule.maximumMarks,
        exam: {
          id: examById.get(String(schedule.examId))._id,
          name: examById.get(String(schedule.examId)).name,
          examType: examById.get(String(schedule.examId)).examType,
          status: examById.get(String(schedule.examId)).status,
        },
      }));
  };

  const listOwnExams = async ({ actor }) => {
    requireStudentRole(actor);
    return listStudentExams({ actor });
  };

  const listChildExams = async ({ actor, studentUserId }) => (
    listStudentExams({ actor, studentUserId })
  );

  const correctPublishedResult = async ({ actor, resultId, payload }) => {
    requireObjectId(actor?.sub, 'authenticated user');
    requireObjectId(resultId, 'resultId');
    if (!hasPermission(actor, PERMISSIONS.EXAM_RESULTS_CORRECT)) {
      throw new ApiError(403, 'You do not have permission to correct examination results');
    }
    const initial = await models.Result.findById(resultId).lean();
    if (!initial) throw new ApiError(404, 'Examination result not found', { code: 'RESULT_NOT_FOUND' });
    return transaction(async (session) => {
      await examinations.lockExamWorkflow(initial.examId, session);
      const exam = await examinations.getExam(initial.examId, session);
      await results.lockGradeScale(exam.academicSessionId, session);
      let currentQuery = models.Result.findById(resultId);
      if (session) currentQuery = currentQuery.session(session);
      const current = await currentQuery.lean();
      if (!current) throw new ApiError(404, 'Examination result not found', { code: 'RESULT_NOT_FOUND' });
      if (current.status !== 'PUBLISHED') {
        throw new ApiError(409, 'Only published results require this correction workflow', {
          code: 'RESULT_NOT_PUBLISHED',
        });
      }
      const schedule = await examinations.getSchedule(payload.examScheduleId, session);
      if (String(schedule.examId) !== String(current.examId)
        || !current.subjects.some((subject) => String(subject.examScheduleId) === String(schedule._id))) {
        throw new ApiError(400, 'Correction schedule must belong to the published result', {
          code: 'CORRECTION_SCHEDULE_MISMATCH',
        });
      }
      if (!['PRESENT', 'ABSENT'].includes(payload.status)
        || (payload.status === 'PRESENT' && !Number.isInteger(payload.obtainedMarks))
        || (payload.status === 'ABSENT' && payload.obtainedMarks !== undefined)) {
        throw new ApiError(400, 'Correction must contain valid marks or an explicit absent status', {
          code: 'INVALID_CORRECTION_MARKS',
        });
      }
      if (payload.status === 'PRESENT'
        && (payload.obtainedMarks < 0 || payload.obtainedMarks > schedule.maximumMarks)) {
        throw new ApiError(400, 'Corrected marks must be between zero and the schedule maximum', {
          code: 'INVALID_CORRECTION_MARKS',
        });
      }
      let markQuery = models.Mark.findOne({
        examScheduleId: schedule._id,
        studentUserId: current.studentUserId,
      });
      if (session) markQuery = markQuery.session(session);
      const oldMark = await markQuery.lean();
      if (!oldMark) throw new ApiError(409, 'Published result has no corresponding marks record', {
        code: 'RESULT_MARKS_NOT_FOUND',
      });
      const previousSubject = current.subjects.find((subject) => (
        String(subject.examScheduleId) === String(schedule._id)
      ));
      const updatedMark = await models.Mark.findOneAndUpdate(
        { _id: oldMark._id },
        {
          $set: {
            status: payload.status,
            obtainedMarks: payload.status === 'ABSENT' ? null : payload.obtainedMarks,
            updatedBy: actor.sub,
          },
          $inc: { version: 1 },
        },
        { new: true, runValidators: true, session },
      );
      if (!updatedMark) throw new ApiError(409, 'Marks changed concurrently during correction', {
        code: 'MARK_CORRECTION_CONFLICT',
      });
      const correctedValues = await results.calculateStudentResult({
        examId: current.examId,
        studentUserId: current.studentUserId,
        session,
      });
      const correctedResult = await models.Result.findOneAndUpdate(
        { _id: current._id, status: 'PUBLISHED' },
        {
          $set: {
            ...correctedValues,
            status: 'DRAFT',
            finalizedAt: null,
            publishedAt: null,
          },
          $inc: { correctionCount: 1 },
        },
        { new: true, runValidators: true, session },
      );
      if (!correctedResult) throw new ApiError(409, 'Result changed concurrently during correction', {
        code: 'RESULT_CORRECTION_CONFLICT',
      });
      await models.ExamAudit.create([{
        resourceType: 'RESULT',
        resourceId: current._id,
        examId: current.examId,
        actorUserId: actor.sub,
        action: 'RESULT_CORRECTED',
        previousValue: {
          mark: { status: oldMark.status, obtainedMarks: oldMark.obtainedMarks },
          subject: previousSubject,
          result: {
            totalObtainedMarks: current.totalObtainedMarks,
            totalMaximumMarks: current.totalMaximumMarks,
            overallPercentage: current.overallPercentage,
            overallGrade: current.overallGrade,
            status: current.status,
          },
        },
        nextValue: {
          mark: { status: updatedMark.status, obtainedMarks: updatedMark.obtainedMarks },
          subject: correctedResult.subjects.find((subject) => (
            String(subject.examScheduleId) === String(schedule._id)
          )),
          result: {
            totalObtainedMarks: correctedResult.totalObtainedMarks,
            totalMaximumMarks: correctedResult.totalMaximumMarks,
            overallPercentage: correctedResult.overallPercentage,
            overallGrade: correctedResult.overallGrade,
            status: correctedResult.status,
          },
        },
        reason: payload.reason,
      }], { session });
      return correctedResult;
    });
  };

  const toStudentResult = (result) => {
    const {
      studentUserId,
      enrollmentId,
      gradeScaleId,
      ...safeResult
    } = result;
    return safeResult;
  };

  const toTeacherResult = (result, scheduleIds) => ({
    _id: result._id,
    examId: result.examId,
    academicSessionId: result.academicSessionId,
    studentUserId: result.studentUserId,
    status: result.status,
    subjects: result.subjects.filter(({ examScheduleId }) => scheduleIds.has(String(examScheduleId))),
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  });

  return {
    publishResults,
    listExamResults,
    getExamResult,
    listOwnResults,
    getOwnResult,
    listChildResults,
    listOwnExams,
    listChildExams,
    correctPublishedResult,
  };
};

module.exports = { ...createResultPublishingService(), createResultPublishingService };
