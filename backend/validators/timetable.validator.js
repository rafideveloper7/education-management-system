const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'A valid ObjectId is required');

const entryFields = {
  academicSessionId: objectId,
  classId: objectId,
  sectionId: objectId,
  subjectId: objectId,
  teacherId: objectId,
  day: z.string().trim().min(1).max(40),
  periodId: z.string().trim().min(1).max(100),
};

const createEntrySchema = z.object(entryFields).strict();
const updateEntrySchema = z.object(entryFields).strict();
const entryParamsSchema = z.object({ entryId: objectId }).strict();
const studentParamsSchema = z.object({ studentId: objectId }).strict();
const classParamsSchema = z.object({
  classId: objectId,
  sectionId: objectId,
}).strict();
const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().min(1).max(256).regex(/^[A-Za-z0-9_-]+$/).optional(),
}).strict();

module.exports = {
  createEntrySchema,
  updateEntrySchema,
  entryParamsSchema,
  studentParamsSchema,
  classParamsSchema,
  listQuerySchema,
};
