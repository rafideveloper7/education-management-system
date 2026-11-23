const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'A valid ObjectId is required');
const statuses = ['DRAFT', 'PUBLISHED', 'CLOSED'];
const date = z.coerce.date();

const assignmentCreateSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(10000),
  academicSessionId: objectId,
  classId: objectId,
  sectionId: objectId,
  subjectId: objectId,
  dueAt: date,
}).strict();

const assignmentUpdateSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().min(1).max(10000).optional(),
  academicSessionId: objectId.optional(),
  classId: objectId.optional(),
  sectionId: objectId.optional(),
  subjectId: objectId.optional(),
  dueAt: date.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required');

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().min(1).max(256).regex(/^[A-Za-z0-9_-]+$/).optional(),
  status: z.enum(statuses).optional(),
  subjectId: objectId.optional(),
  academicSessionId: objectId.optional(),
}).strict();

const uploadPolicySchema = z.object({
  attachmentMaxBytes: z.number().int().min(1).max(50 * 1024 * 1024).optional(),
  submissionMaxBytes: z.number().int().min(1).max(50 * 1024 * 1024).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one upload limit is required');

module.exports = {
  assignmentCreateSchema,
  assignmentUpdateSchema,
  assignmentParamsSchema: z.object({ assignmentId: objectId }).strict(),
  submissionParamsSchema: z.object({ submissionId: objectId }).strict(),
  attachmentParamsSchema: z.object({ assignmentId: objectId, fileId: objectId }).strict(),
  deadlineSchema: z.object({ dueAt: date, reason: z.string().trim().min(1).max(500) }).strict(),
  uploadPolicySchema,
  listQuerySchema,
};