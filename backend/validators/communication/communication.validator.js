const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'A valid ObjectId is required');

const conversationCreateSchema = z.object({
  participantId: objectId,
  title: z.string().trim().min(1).max(200).optional(),
}).strict();

const conversationParamsSchema = z.object({ conversationId: objectId }).strict();
const messageCreateSchema = z.object({
  content: z.string().trim().min(1).max(5000),
}).strict();

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().min(1).max(256).regex(/^[A-Za-z0-9_-]+$/).optional(),
  status: z.enum(['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'PENDING', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'DRAFT']).optional(),
}).strict();

const complaintCreateSchema = z.object({
  category: z.string().trim().min(1).max(100),
  subject: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(10000),
}).strict();

const complaintParamsSchema = z.object({ complaintId: objectId }).strict();
const complaintAssignSchema = z.object({ assignedTo: objectId }).strict();
const complaintStatusSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']),
  resolutionNote: z.string().trim().min(1).max(5000).optional(),
}).strict();

const leaveRequestCreateSchema = z.object({
  studentId: objectId,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().trim().min(1).max(5000),
}).strict().refine((value) => value.endDate >= value.startDate, {
  message: 'endDate must be on or after startDate',
  path: ['endDate'],
});

const leaveRequestParamsSchema = z.object({ leaveRequestId: objectId }).strict();
const leaveReviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().trim().min(1).max(5000).optional(),
}).strict();

const announcementCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(20000),
  audience: z.array(z.enum(['ALL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'])).min(1).max(5).default(['ALL']),
  expiresAt: z.coerce.date().optional(),
}).strict();

const announcementParamsSchema = z.object({ announcementId: objectId }).strict();
const auditEntityType = z.enum(['CONVERSATION', 'MESSAGE', 'COMPLAINT', 'LEAVE_REQUEST', 'ANNOUNCEMENT']);
const auditParamsSchema = z.object({ entityType: auditEntityType, entityId: objectId }).strict();
const auditIdParamsSchema = z.object({ auditId: objectId }).strict();
const auditListQuerySchema = z.object({
  entityType: auditEntityType.optional(),
  entityId: objectId.optional(),
  action: z.string().trim().min(1).max(100).optional(),
  performedBy: objectId.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().min(1).max(256).regex(/^[A-Za-z0-9_-]+$/).optional(),
}).strict().refine((value) => !value.from || !value.to || value.from <= value.to, {
  message: 'from must be on or before to',
  path: ['from'],
});

module.exports = {
  conversationCreateSchema,
  conversationParamsSchema,
  messageCreateSchema,
  listQuerySchema,
  complaintCreateSchema,
  complaintParamsSchema,
  complaintAssignSchema,
  complaintStatusSchema,
  leaveRequestCreateSchema,
  leaveRequestParamsSchema,
  leaveReviewSchema,
  announcementCreateSchema,
  announcementParamsSchema,
  auditParamsSchema,
  auditIdParamsSchema,
  auditListQuerySchema,
};
