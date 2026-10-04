const { z } = require('zod');
const ApiError = require('../../utils/ApiError');

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'A valid ObjectId is required');
const dateSchema = z.coerce.date();

const parentStudentCreateSchema = z.object({
  parentUserId: objectIdSchema,
  studentUserId: objectIdSchema,
  relationshipType: z.enum(['FATHER', 'MOTHER', 'GUARDIAN', 'UNCLE', 'AUNT', 'GRANDPARENT', 'OTHER']),
  validFrom: dateSchema.optional(),
  notes: z.string().trim().max(500).optional(),
}).strict();

const studentEnrollmentCreateSchema = z.object({
  studentUserId: objectIdSchema,
  academicSessionId: objectIdSchema,
  classId: objectIdSchema,
  sectionId: objectIdSchema,
  rollNumber: z.string().trim().max(30).optional(),
  validFrom: dateSchema.optional(),
}).strict();

const teacherAssignmentCreateSchema = z.object({
  teacherUserId: objectIdSchema,
  academicSessionId: objectIdSchema,
  subjectId: objectIdSchema,
  classId: objectIdSchema,
  sectionId: objectIdSchema,
  validFrom: dateSchema.optional(),
}).strict();

const paginationQueryFields = {
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().min(1).max(256).regex(/^[A-Za-z0-9_-]+$/).optional(),
};

const parentStudentListQuerySchema = z.object({
  parentUserId: objectIdSchema.optional(),
  studentUserId: objectIdSchema.optional(),
  relationshipType: z.enum(['FATHER', 'MOTHER', 'GUARDIAN', 'UNCLE', 'AUNT', 'GRANDPARENT', 'OTHER']).optional(),
  status: z.enum(['ACTIVE', 'ENDED', 'DECEASED']).optional(),
  ...paginationQueryFields,
}).strict();

const studentEnrollmentListQuerySchema = z.object({
  studentUserId: objectIdSchema.optional(),
  academicSessionId: objectIdSchema.optional(),
  classId: objectIdSchema.optional(),
  sectionId: objectIdSchema.optional(),
  rollNumber: z.string().trim().max(30).optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ENDED', 'SUSPENDED']).optional(),
  ...paginationQueryFields,
}).strict();

const teacherAssignmentListQuerySchema = z.object({
  teacherUserId: objectIdSchema.optional(),
  academicSessionId: objectIdSchema.optional(),
  classId: objectIdSchema.optional(),
  sectionId: objectIdSchema.optional(),
  subjectId: objectIdSchema.optional(),
  status: z.enum(['ACTIVE', 'ENDED', 'CANCELLED']).optional(),
  ...paginationQueryFields,
}).strict();

const relationshipParamsSchema = z.object({
  relationshipId: objectIdSchema,
}).strict();

const parentStudentCloseSchema = z.object({
  status: z.enum(['ENDED', 'DECEASED']).default('ENDED'),
  effectiveAt: dateSchema.optional(),
}).strict();

const studentEnrollmentCloseSchema = z.object({
  status: z.enum(['COMPLETED', 'ENDED', 'SUSPENDED']).default('ENDED'),
  effectiveAt: dateSchema.optional(),
}).strict();

const teacherAssignmentCloseSchema = z.object({
  status: z.enum(['ENDED', 'CANCELLED']).default('ENDED'),
  effectiveAt: dateSchema.optional(),
}).strict();

const toValidationError = (error) => {
  return new ApiError(400, 'Request validation failed', {
    code: 'VALIDATION_ERROR',
    details: error.issues.flatMap((issue) => issue.code === 'unrecognized_keys'
      ? issue.keys.map((field) => ({ field, message: 'Unrecognized field' }))
      : [{ field: issue.path.join('.'), message: issue.message }]),
  });
};

const parse = (schema, payload) => {
  const result = schema.safeParse(payload || {});
  if (!result.success) {
    throw toValidationError(result.error);
  }
  return result.data;
};

module.exports = {
  parentStudentCreateSchema,
  studentEnrollmentCreateSchema,
  teacherAssignmentCreateSchema,
  parentStudentListQuerySchema,
  studentEnrollmentListQuerySchema,
  teacherAssignmentListQuerySchema,
  relationshipParamsSchema,
  parentStudentCloseSchema,
  studentEnrollmentCloseSchema,
  teacherAssignmentCloseSchema,
  parseParentStudentCreate: (payload) => parse(parentStudentCreateSchema, payload),
  parseStudentEnrollmentCreate: (payload) => parse(studentEnrollmentCreateSchema, payload),
  parseTeacherAssignmentCreate: (payload) => parse(teacherAssignmentCreateSchema, payload),
  parseParentStudentListQuery: (payload) => parse(parentStudentListQuerySchema, payload),
  parseStudentEnrollmentListQuery: (payload) => parse(studentEnrollmentListQuerySchema, payload),
  parseTeacherAssignmentListQuery: (payload) => parse(teacherAssignmentListQuerySchema, payload),
  parseCloseRelationship: (payload) => parse(parentStudentCloseSchema, payload),
};