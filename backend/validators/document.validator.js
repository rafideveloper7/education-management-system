const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'A valid ObjectId is required');

const uploadDocumentSchema = z.object({
  ownerType: z.enum(['STUDENT', 'TEACHER', 'USER']),
  ownerId: objectId,
  category: z.enum(['STUDENT_DOCUMENT', 'TEACHER_DOCUMENT', 'CERTIFICATE']),
  title: z.string().trim().min(1).max(200),
}).strict();

const documentIdParamsSchema = z.object({ documentId: objectId }).strict();
const existingAdmissionParamsSchema = z.object({ documentId: objectId }).strict();
const existingAssignmentAttachmentParamsSchema = z.object({
  assignmentId: objectId,
  fileId: objectId,
}).strict();
const existingAssignmentSubmissionParamsSchema = z.object({ submissionId: objectId }).strict();

const cursor = z.string().min(1).max(256).regex(/^[A-Za-z0-9_-]+$/).optional();
const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor,
}).strict();

const documentListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor,
  category: z.enum(['STUDENT_DOCUMENT', 'TEACHER_DOCUMENT', 'CERTIFICATE']).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  ownerType: z.enum(['STUDENT', 'TEACHER', 'USER']).optional(),
  ownerId: objectId.optional(),
}).strict();

module.exports = {
  uploadDocumentSchema,
  documentIdParamsSchema,
  existingAdmissionParamsSchema,
  existingAssignmentAttachmentParamsSchema,
  existingAssignmentSubmissionParamsSchema,
  paginationQuerySchema,
  documentListQuerySchema,
};
