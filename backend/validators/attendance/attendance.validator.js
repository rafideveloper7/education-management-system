const { z } = require('zod');
const { isDateKey } = require('../../utils/attendanceDate');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'A valid ObjectId is required');
const dateKey = z.string().refine(isDateKey, 'A valid date in YYYY-MM-DD format is required');
const pagination = {
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().min(1).max(256).regex(/^[A-Za-z0-9_-]+$/).optional(),
};

const markBatchSchema = z.object({
  academicSessionId: objectId,
  classId: objectId,
  attendanceDate: dateKey,
  records: z.array(z.object({
    enrollmentId: objectId,
    status: z.enum(['PRESENT', 'ABSENT']),
  }).strict()).min(1).max(500),
}).strict().superRefine((payload, context) => {
  const enrollmentIds = payload.records.map(({ enrollmentId }) => enrollmentId);
  if (new Set(enrollmentIds).size !== enrollmentIds.length) {
    context.addIssue({ code: 'custom', path: ['records'], message: 'An enrollment may appear only once per batch' });
  }
});

const sectionParamsSchema = z.object({ sectionId: objectId }).strict();
const recordParamsSchema = z.object({ recordId: objectId }).strict();
const sectionAttendanceQuerySchema = z.object({
  academicSessionId: objectId,
  classId: objectId,
  attendanceDate: dateKey,
}).strict();
const studentHistoryParamsSchema = z.object({ studentUserId: objectId }).strict();
const studentHistoryQuerySchema = z.object({
  academicSessionId: objectId.optional(),
  fromDate: dateKey.optional(),
  toDate: dateKey.optional(),
  ...pagination,
}).strict().refine((query) => !query.fromDate || !query.toDate || query.fromDate <= query.toDate, {
  path: ['toDate'],
  message: 'toDate must be on or after fromDate',
});
const correctionSchema = z.object({
  status: z.enum(['PRESENT', 'ABSENT']),
  reason: z.string().trim().min(3).max(500),
}).strict();

module.exports = {
  markBatchSchema,
  sectionParamsSchema,
  recordParamsSchema,
  sectionAttendanceQuerySchema,
  studentHistoryParamsSchema,
  studentHistoryQuerySchema,
  correctionSchema,
};