// Admission Validators
// Section 5.2-5.10: Request validation schemas for admission module

const { z } = require('zod');

// ── Common Parameter Schemas ────────────────────────────────────────────────
const configurationParamsSchema = z.object({
  configurationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid configuration ID'),
});

const applicationParamsSchema = z.object({
  applicationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid application ID'),
});

const documentParamsSchema = z.object({
  documentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid document ID'),
});

const studentParamsSchema = z.object({
  studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID'),
});

// ── Admission Configuration ─────────────────────────────────────────────────
const createAdmissionConfigurationFields = z.object({
  academicSessionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid academic session ID'),
  name: z.string().min(3).max(120),
  description: z.string().max(500).optional(),
  admissionEnabled: z.boolean().default(true),
  submissionStartDate: z.string().datetime(),
  submissionEndDate: z.string().datetime(),
  applicableClasses: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  eligibilityCriteria: z.object({
    minimumAge: z.number().min(0).max(100).optional(),
    maximumAge: z.number().min(0).max(100).optional(),
    previousAcademicRequired: z.boolean().default(false),
    entranceTestRequired: z.boolean().default(false),
    interviewRequired: z.boolean().default(false),
  }).optional(),
  requiredFields: z.array(z.object({
    fieldName: z.string().min(1).max(50),
    fieldType: z.enum(['TEXT', 'NUMBER', 'DATE', 'SELECT', 'BOOLEAN']),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
    validationRules: z.string().optional(),
  })).optional(),
  requiredDocuments: z.array(z.object({
    documentType: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    required: z.boolean().default(true),
    allowedFileTypes: z.array(z.string()).optional(),
    maxFileSize: z.number().min(0).optional(),
  })).optional(),
  feeConfiguration: z.object({
    applicationFee: z.number().min(0).default(0),
    admissionFee: z.number().min(0).default(0),
    feePaymentRequired: z.boolean().default(false),
    paymentStage: z.enum(['APPLICATION', 'APPROVAL', 'ENROLLMENT']).default('ENROLLMENT'),
  }).optional(),
  approvalWorkflow: z.object({
    requiresReview: z.boolean().default(true),
    autoApprove: z.boolean().default(false),
    approvalRequiredBy: z.enum(['SINGLE_ADMIN', 'MULTIPLE_ADMINS', 'COMMITTEE']).default('SINGLE_ADMIN'),
  }).optional(),
});

const createAdmissionConfigurationSchema = createAdmissionConfigurationFields.superRefine((value, ctx) => {
  const start = new Date(value.submissionStartDate);
  const end = new Date(value.submissionEndDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    ctx.addIssue({
      code: 'custom',
      path: ['submissionEndDate'],
      message: 'submissionEndDate must be on or after submissionStartDate',
    });
  }
});

const updateAdmissionConfigurationSchema = createAdmissionConfigurationFields.partial().superRefine((value, ctx) => {
  if (value.submissionStartDate && value.submissionEndDate) {
    const start = new Date(value.submissionStartDate);
    const end = new Date(value.submissionEndDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      ctx.addIssue({
        code: 'custom',
        path: ['submissionEndDate'],
        message: 'submissionEndDate must be on or after submissionStartDate',
      });
    }
  }
});

const admissionConfigurationListQuerySchema = z.object({
  currentlyOpen: z.enum(['true', 'false']).optional(),
  academicSessionId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

// ── Admission Application ───────────────────────────────────────────────────
const createAdmissionApplicationFields = z.object({
  admissionConfigurationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid configuration ID'),
  applicantFullName: z.string().min(3).max(120),
  applicantDateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  applicantGender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  applicantEmail: z.string().email().max(100),
  applicantPhone: z.string().min(10).max(30),
  applicantAddress: z.string().max(500).optional(),
  applicantNationality: z.string().max(100).optional(),
  appliedClassId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid class ID'),
  previousSchoolName: z.string().max(200).optional(),
  previousClass: z.string().max(50).optional(),
  previousAcademicYear: z.string().max(20).optional(),
  fatherName: z.string().max(120).optional(),
  fatherOccupation: z.string().max(100).optional(),
  fatherPhone: z.string().max(30).optional(),
  motherName: z.string().max(120).optional(),
  motherOccupation: z.string().max(100).optional(),
  motherPhone: z.string().max(30).optional(),
  guardianName: z.string().max(120).optional(),
  guardianRelation: z.string().max(50).optional(),
  guardianPhone: z.string().max(30).optional(),
});

const createAdmissionApplicationSchema = createAdmissionApplicationFields.superRefine((value, ctx) => {
  const date = new Date(`${value.applicantDateOfBirth}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date > new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')) {
    ctx.addIssue({
      code: 'custom',
      path: ['applicantDateOfBirth'],
      message: 'applicantDateOfBirth cannot be in the future',
    });
  }
});

const updateAdmissionApplicationSchema = createAdmissionApplicationFields.partial().superRefine((value, ctx) => {
  if (value.applicantDateOfBirth) {
    const date = new Date(`${value.applicantDateOfBirth}T00:00:00Z`);
    if (Number.isNaN(date.getTime()) || date > new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')) {
      ctx.addIssue({
        code: 'custom',
        path: ['applicantDateOfBirth'],
        message: 'applicantDateOfBirth cannot be in the future',
      });
    }
  }
});

const applicationListQuerySchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REQUIRES_MORE_INFO', 'APPROVED', 'REJECTED', 'ONBOARDED', 'ENROLLED']).optional(),
  academicSessionId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  classId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  search: z.string().max(100).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
});

// ── Document Management ─────────────────────────────────────────────────────
const uploadDocumentSchema = z.object({
  documentType: z.string().min(1).max(100),
  documentName: z.string().max(200).optional(),
  documentDescription: z.string().max(500).optional(),
});

const replaceDocumentSchema = uploadDocumentSchema;

const verifyDocumentSchema = z.object({
  verificationNotes: z.string().max(1000).optional(),
  status: z.enum(['VERIFIED', 'REJECTED']),
});

// ── Eligibility & Validation ────────────────────────────────────────────────
const checkEligibilitySchema = createAdmissionApplicationFields.pick({
  applicantDateOfBirth: true,
  appliedClassId: true,
});

const validateApplicationSchema = createAdmissionApplicationFields.pick({
  applicantEmail: true,
  applicantPhone: true,
  applicantDateOfBirth: true,
  appliedClassId: true,
  admissionConfigurationId: true,
});

// ── Workflow Management ─────────────────────────────────────────────────────
const startReviewSchema = z.object({
  reviewNotes: z.string().max(2000).optional(),
});

const requestMoreInfoSchema = z.object({
  requestNotes: z.string().min(10).max(2000),
});

const approveApplicationSchema = z.object({
  approvalNotes: z.string().max(2000).optional(),
});

const rejectApplicationSchema = z.object({
  rejectionNotes: z.string().min(10).max(2000),
});

const completeReviewSchema = z.object({
  reviewNotes: z.string().max(2000).optional(),
});

// ── Onboarding Management ───────────────────────────────────────────────────
const onboardStudentSchema = z.object({
  academicSessionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid academic session ID'),
  classId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid class ID'),
  sectionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid section ID'),
});

const linkParentSchema = z.object({
  fullName: z.string().min(3).max(120),
  email: z.string().email().max(100),
  phone: z.string().min(10).max(30),
  relationshipType: z.enum(['FATHER', 'MOTHER', 'GUARDIAN', 'UNCLE', 'AUNT', 'GRANDPARENT', 'OTHER']),
  address: z.string().max(500).optional(),
  occupation: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

const enrollStudentSchema = z.object({
  academicSessionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid academic session ID'),
  classId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid class ID'),
  sectionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid section ID'),
  rollNumber: z.string().max(30).optional(),
});

const completeAdmissionWorkflowSchema = z.object({
  academicSessionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid academic session ID'),
  classId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid class ID'),
  sectionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid section ID'),
  rollNumber: z.string().max(30).optional(),
  parents: z.array(linkParentSchema).optional(),
});

// ── Reports & Analytics ─────────────────────────────────────────────────────
const dashboardStatsQuerySchema = z.object({
  academicSessionId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

const applicationStatsQuerySchema = z.object({
  academicSessionId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

const admissionReportQuerySchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REQUIRES_MORE_INFO', 'APPROVED', 'REJECTED', 'ONBOARDED', 'ENROLLED']).optional(),
  decision: z.enum(['APPROVED', 'REJECTED', 'PENDING']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  academicSessionId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

const classStatisticsQuerySchema = z.object({
  academicSessionId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

const admissionTrendsQuerySchema = z.object({
  academicSessionId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  period: z.enum(['daily', 'weekly', 'monthly']).default('monthly'),
});

module.exports = {
  // Parameter schemas
  configurationParamsSchema,
  applicationParamsSchema,
  documentParamsSchema,
  studentParamsSchema,
  
  // Configuration schemas
  createAdmissionConfigurationSchema,
  updateAdmissionConfigurationSchema,
  admissionConfigurationListQuerySchema,
  
  // Application schemas
  createAdmissionApplicationSchema,
  updateAdmissionApplicationSchema,
  applicationListQuerySchema,
  
  // Document schemas
  uploadDocumentSchema,
  replaceDocumentSchema,
  verifyDocumentSchema,
  
  // Eligibility & Validation
  checkEligibilitySchema,
  validateApplicationSchema,
  
  // Workflow schemas
  startReviewSchema,
  requestMoreInfoSchema,
  approveApplicationSchema,
  rejectApplicationSchema,
  completeReviewSchema,
  
  // Onboarding schemas
  onboardStudentSchema,
  linkParentSchema,
  enrollStudentSchema,
  completeAdmissionWorkflowSchema,
  
  // Report schemas
  dashboardStatsQuerySchema,
  applicationStatsQuerySchema,
  admissionReportQuerySchema,
  classStatisticsQuerySchema,
  admissionTrendsQuerySchema,
};