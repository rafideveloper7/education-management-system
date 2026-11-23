const Mark = require('../../models/examination/Mark');
const Result = require('../../models/examination/Result');
const ExamAudit = require('../../models/examination/ExamAudit');
const ApiError = require('../../utils/ApiError');
const { PERMISSIONS } = require('../../authorization/constants/permissions.constants');
const {
  requireObjectId,
  assertPermission,
  runInTransaction,
  encodeCursor,
  decodeCursor,
} = require('./examination.helpers');
const examService = require('./exam.service');

const createMarksService = ({
  models = { Mark, Result, ExamAudit },
  examinations = examService,
  transaction = runInTransaction,
} = {}) => {
  const listMarks = async ({ actor, scheduleId, filters }) => {
    assertPermission(actor, PERMISSIONS.RESULT_VIEW);
    requireObjectId(scheduleId, 'scheduleId');
    const schedule = await examinations.getSchedule(scheduleId);
    await examinations.assertScheduleAccess(actor, schedule);

    const query = { examScheduleId: schedule._id };
    if (filters.cursor) {
      const position = decodeCursor(filters.cursor);
      query.$or = [
        { createdAt: { $lt: position.createdAt } },
        { createdAt: position.createdAt, _id: { $lt: position.id } },
      ];
    }
    const records = await models.Mark.find(query)
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

  const enterMarks = async ({ actor, scheduleId, records }) => {
    requireObjectId(actor?.sub, 'authenticated user');
    assertPermission(actor, PERMISSIONS.RESULT_ENTER);
    requireObjectId(scheduleId, 'scheduleId');
    const schedule = await examinations.getSchedule(scheduleId);
    await examinations.assertScheduleAccess(actor, schedule);
    const exam = await examinations.getExam(schedule.examId);
    if (!['COMPLETED', 'RESULTS_READY'].includes(exam.status)) {
      throw new ApiError(409, 'Marks can only be entered after the examination is completed', {
        code: 'EXAM_NOT_READY_FOR_MARKS',
      });
    }
    if (!Array.isArray(records) || records.length === 0 || records.length > 500) {
      throw new ApiError(400, 'A marks batch must contain between 1 and 500 records', {
        code: 'INVALID_MARKS_BATCH',
      });
    }
    const studentIds = records.map(({ studentUserId }) => String(studentUserId));
    if (new Set(studentIds).size !== studentIds.length) {
      throw new ApiError(400, 'A student may appear only once per marks batch', {
        code: 'DUPLICATE_STUDENT_MARK',
      });
    }

    for (const [index, record] of records.entries()) {
      requireObjectId(record.studentUserId, `records[${index}].studentUserId`);
      if (!['PRESENT', 'ABSENT'].includes(record.status)) {
        throw new ApiError(400, 'status must be PRESENT or ABSENT', { code: 'INVALID_MARK_STATUS' });
      }
      if (record.status === 'PRESENT') {
        if (!Number.isInteger(record.obtainedMarks) || record.obtainedMarks < 0) {
          throw new ApiError(400, 'obtainedMarks must be a non-negative whole number', {
            code: 'INVALID_OBTAINED_MARKS',
          });
        }
        if (record.obtainedMarks > schedule.maximumMarks) {
          throw new ApiError(400, 'obtainedMarks cannot exceed maximumMarks', {
            code: 'MARKS_EXCEED_MAXIMUM',
            details: [{ field: `records.${index}.obtainedMarks`, message: `Maximum is ${schedule.maximumMarks}` }],
          });
        }
      } else if (record.obtainedMarks !== undefined) {
        throw new ApiError(400, 'Absent students must not have obtainedMarks', {
          code: 'ABSENT_MARKS_NOT_ALLOWED',
        });
      }
    }

    return transaction(async (session) => {
      await examinations.lockExamWorkflow(exam._id, session);
      const currentExam = await examinations.getExam(exam._id, session);
      if (!['COMPLETED', 'RESULTS_READY'].includes(currentExam.status)) {
        throw new ApiError(409, 'Marks can only be entered after the examination is completed', {
          code: 'EXAM_NOT_READY_FOR_MARKS',
        });
      }
      const eligibleStudents = await examinations.validEnrollmentsForSchedule(schedule, session);
      const enrollmentByStudent = new Map(
        eligibleStudents.map((enrollment) => [String(enrollment.studentUserId), enrollment])
      );
      if (enrollmentByStudent.size !== eligibleStudents.length) {
        throw new ApiError(409, 'Student has multiple eligible enrollments for this examination schedule', {
          code: 'AMBIGUOUS_STUDENT_ENROLLMENT',
        });
      }
      const savedRecords = [];
      for (const record of records) {
        if (!enrollmentByStudent.has(String(record.studentUserId))) {
          throw new ApiError(400, 'Student is not eligible for this examination schedule', {
            code: 'STUDENT_NOT_ELIGIBLE',
          });
        }
        const enrollment = enrollmentByStudent.get(String(record.studentUserId));
        let existingResultQuery = models.Result.findOne({
          examId: exam._id,
          studentUserId: record.studentUserId,
          status: { $in: ['FINALIZED', 'PUBLISHED'] },
        });
        if (session) existingResultQuery = existingResultQuery.session(session);
        const lockedResult = await existingResultQuery.lean();
        if (lockedResult) {
          throw new ApiError(409, 'Marks for a finalized or published result require the correction workflow', {
            code: 'RESULT_MARKS_LOCKED',
          });
        }

        let existingMarkQuery = models.Mark.findOne({
          examScheduleId: schedule._id,
          studentUserId: record.studentUserId,
        });
        if (session) existingMarkQuery = existingMarkQuery.session(session);
        const previous = await existingMarkQuery.lean();
        if (previous && record.expectedVersion === undefined) {
          throw new ApiError(409, 'expectedVersion is required when changing existing marks', {
            code: 'MARK_VERSION_REQUIRED',
          });
        }
        if (previous && previous.version !== record.expectedVersion) {
          throw new ApiError(409, 'Marks changed after they were read; refresh before updating', {
            code: 'MARK_VERSION_CONFLICT',
          });
        }
        if (!previous && record.expectedVersion !== undefined) {
          throw new ApiError(409, 'Marks no longer exist at the expected version', {
            code: 'MARK_VERSION_CONFLICT',
          });
        }
        const nextStatus = record.status;
        const nextMarks = nextStatus === 'PRESENT' ? record.obtainedMarks : null;
        const update = {
          $set: {
            examId: exam._id,
            enrollmentId: enrollment._id,
            status: nextStatus,
            obtainedMarks: nextMarks,
            updatedBy: actor.sub,
          },
          $setOnInsert: { enteredBy: actor.sub },
        };
        if (previous) update.$inc = { version: 1 };
        else update.$setOnInsert.version = 0;
        const saved = await models.Mark.findOneAndUpdate(
          {
            examScheduleId: schedule._id,
            studentUserId: record.studentUserId,
            ...(previous ? { version: previous.version } : {}),
          },
          update,
          { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true, session },
        );
        await models.ExamAudit.create([{
          resourceType: 'MARK',
          resourceId: saved._id,
          examId: exam._id,
          actorUserId: actor.sub,
          action: previous ? 'MARK_UPDATED' : 'MARK_ENTERED',
          previousValue: previous ? { status: previous.status, obtainedMarks: previous.obtainedMarks } : null,
          nextValue: { status: nextStatus, obtainedMarks: nextMarks },
        }], { session });
        savedRecords.push(saved);
      }
      return savedRecords;
    });
  };

  return { listMarks, enterMarks };
};

module.exports = { ...createMarksService(), createMarksService };
