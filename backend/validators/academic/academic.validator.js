const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'A valid ObjectId is required');
const sessionStatuses = ['PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED'];
const resourceStatuses = ['ACTIVE', 'INACTIVE'];

const sessionCreateSchema = z.object({
  sessionName: z.string().trim().min(1).max(80),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).strict().refine((value) => value.startDate < value.endDate, {
  path: ['endDate'],
  message: 'endDate must be after startDate',
});
const sessionUpdateSchema = z.object({
  sessionName: z.string().trim().min(1).max(80).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required');
const sessionStatusSchema = z.object({ status: z.enum(sessionStatuses) }).strict();

const classCreateSchema = z.object({
  className: z.string().trim().min(1).max(80),
  classCode: z.string().trim().max(30).optional(),
}).strict();
const classUpdateSchema = z.object({
  className: z.string().trim().min(1).max(80).optional(),
  classCode: z.string().trim().max(30).optional(),
  status: z.enum(resourceStatuses).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required');

const sectionCreateSchema = z.object({
  classId: objectId,
  sectionName: z.string().trim().min(1).max(40),
  roomNumber: z.string().trim().max(40).optional(),
  capacity: z.coerce.number().int().min(1).max(500).optional(),
}).strict();
const sectionUpdateSchema = z.object({
  sectionName: z.string().trim().min(1).max(40).optional(),
  roomNumber: z.string().trim().max(40).nullable().optional(),
  capacity: z.coerce.number().int().min(1).max(500).nullable().optional(),
  status: z.enum(resourceStatuses).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required');

const subjectCreateSchema = z.object({
  subjectName: z.string().trim().min(1).max(100),
  subjectCode: z.string().trim().min(1).max(30),
}).strict();
const subjectUpdateSchema = z.object({
  subjectName: z.string().trim().min(1).max(100).optional(),
  subjectCode: z.string().trim().min(1).max(30).optional(),
  status: z.enum(resourceStatuses).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required');

const classSubjectCreateSchema = z.object({
  classId: objectId,
  subjectId: objectId,
  isElective: z.boolean().default(false),
  weeklyPeriods: z.coerce.number().int().min(1).max(60).optional(),
}).strict();
const classSubjectUpdateSchema = z.object({
  isElective: z.boolean().optional(),
  weeklyPeriods: z.coerce.number().int().min(1).max(60).nullable().optional(),
  status: z.enum(resourceStatuses).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required');

const listQuery = (extra = {}) => z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().min(1).max(256).regex(/^[A-Za-z0-9_-]+$/).optional(),
  ...extra,
}).strict();

const validators = {
  sessionCreateSchema,
  sessionUpdateSchema,
  sessionStatusSchema,
  classCreateSchema,
  classUpdateSchema,
  sectionCreateSchema,
  sectionUpdateSchema,
  subjectCreateSchema,
  subjectUpdateSchema,
  classSubjectCreateSchema,
  classSubjectUpdateSchema,
  recordParamsSchema: z.object({ recordId: objectId }).strict(),
  sessionListSchema: listQuery({ status: z.enum(sessionStatuses).optional() }),
  classListSchema: listQuery({ status: z.enum(resourceStatuses).optional() }),
  sectionListSchema: listQuery({
    status: z.enum(resourceStatuses).optional(),
    classId: objectId.optional(),
  }),
  subjectListSchema: listQuery({ status: z.enum(resourceStatuses).optional() }),
  classSubjectListSchema: listQuery({
    status: z.enum(resourceStatuses).optional(),
    classId: objectId.optional(),
    subjectId: objectId.optional(),
  }),
};

module.exports = validators;