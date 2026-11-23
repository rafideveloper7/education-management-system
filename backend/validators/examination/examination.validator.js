const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'A valid ObjectId is required');
const pagination = {
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().min(1).max(256).regex(/^[A-Za-z0-9_-]+$/).optional(),
};
const examStatuses = ['DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'RESULTS_READY'];
const resultStatuses = ['DRAFT', 'FINALIZED', 'PUBLISHED'];
const gradeBandSchema = z.object({
  minimumPercentage: z.number().min(0).max(100),
  maximumPercentage: z.number().min(0).max(100),
  grade: z.string().trim().min(1).max(12),
  isPassing: z.boolean(),
}).strict();

const examCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  examType: z.string().trim().min(1).max(60),
  academicSessionId: objectId,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).strict().refine((exam) => exam.startDate <= exam.endDate, {
  path: ['endDate'],
  message: 'endDate must be on or after startDate',
});
const examUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  examType: z.string().trim().min(1).max(60).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).strict().refine((exam) => Object.keys(exam).length > 0, 'At least one field is required');

const scheduleFields = {
  classId: objectId,
  sectionId: objectId,
  subjectId: objectId,
  teacherUserId: objectId.nullable().optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  room: z.string().trim().min(1).max(40).nullable().optional(),
  maximumMarks: z.number().int().min(1).max(100000),
};
const scheduleCreateSchema = z.object(scheduleFields).strict().refine((schedule) => (
  schedule.startAt < schedule.endAt
), {
  path: ['endAt'],
  message: 'endAt must be after startAt',
});
const scheduleUpdateSchema = z.object({
  ...Object.fromEntries(Object.entries(scheduleFields).map(([field, schema]) => [field, schema.optional()])),
}).strict().refine((schedule) => Object.keys(schedule).length > 0, 'At least one field is required')
  .refine((schedule) => !schedule.startAt || !schedule.endAt || schedule.startAt < schedule.endAt, {
    path: ['endAt'],
    message: 'endAt must be after startAt',
  });

const markRecordSchema = z.object({
  studentUserId: objectId,
  status: z.enum(['PRESENT', 'ABSENT']),
  obtainedMarks: z.number().int().min(0).optional(),
  expectedVersion: z.number().int().min(0).optional(),
}).strict().superRefine((record, context) => {
  if (record.status === 'PRESENT' && record.obtainedMarks === undefined) {
    context.addIssue({ code: 'custom', path: ['obtainedMarks'], message: 'obtainedMarks is required for present students' });
  }
  if (record.status === 'ABSENT' && record.obtainedMarks !== undefined) {
    context.addIssue({ code: 'custom', path: ['obtainedMarks'], message: 'Absent students must not have obtainedMarks' });
  }
});
const markBatchSchema = z.object({
  records: z.array(markRecordSchema).min(1).max(500),
}).strict().superRefine(({ records }, context) => {
  const studentIds = records.map(({ studentUserId }) => studentUserId);
  if (new Set(studentIds).size !== studentIds.length) {
    context.addIssue({ code: 'custom', path: ['records'], message: 'A student may appear only once per batch' });
  }
});

const gradeScaleCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  academicSessionId: objectId,
  calculateOverallGrade: z.boolean().default(false),
  gradeBands: z.array(gradeBandSchema).min(1).max(20),
}).strict();
const gradeScaleUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  calculateOverallGrade: z.boolean().optional(),
  gradeBands: z.array(gradeBandSchema).min(1).max(20).optional(),
}).strict().refine((scale) => Object.keys(scale).length > 0, 'At least one field is required');

const correctionSchema = z.object({
  examScheduleId: objectId,
  status: z.enum(['PRESENT', 'ABSENT']),
  obtainedMarks: z.number().int().min(0).optional(),
  reason: z.string().trim().min(3).max(500),
}).strict().superRefine((correction, context) => {
  if (correction.status === 'PRESENT' && correction.obtainedMarks === undefined) {
    context.addIssue({ code: 'custom', path: ['obtainedMarks'], message: 'obtainedMarks is required for present students' });
  }
  if (correction.status === 'ABSENT' && correction.obtainedMarks !== undefined) {
    context.addIssue({ code: 'custom', path: ['obtainedMarks'], message: 'Absent students must not have obtainedMarks' });
  }
});

const listQuery = (fields = {}) => z.object({ ...pagination, ...fields }).strict();

module.exports = {
  examCreateSchema,
  examUpdateSchema,
  examStatusSchema: z.object({ status: z.enum(examStatuses) }).strict(),
  examParamsSchema: z.object({ examId: objectId }).strict(),
  scheduleParamsSchema: z.object({ scheduleId: objectId }).strict(),
  resultParamsSchema: z.object({ resultId: objectId }).strict(),
  studentParamsSchema: z.object({ studentUserId: objectId }).strict(),
  scheduleCreateSchema,
  scheduleUpdateSchema,
  markBatchSchema,
  gradeScaleCreateSchema,
  gradeScaleUpdateSchema,
  gradeScaleParamsSchema: z.object({ gradeScaleId: objectId }).strict(),
  correctionSchema,
  examListQuerySchema: listQuery({
    academicSessionId: objectId.optional(),
    status: z.enum(examStatuses).optional(),
  }),
  scheduleListQuerySchema: listQuery({}),
  gradeScaleListQuerySchema: listQuery({ academicSessionId: objectId.optional() }),
  resultListQuerySchema: listQuery({
    studentUserId: objectId.optional(),
    status: z.enum(resultStatuses).optional(),
  }),
  studentResultListQuerySchema: listQuery({}),
};
