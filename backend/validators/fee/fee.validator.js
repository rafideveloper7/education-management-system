const { z } = require('zod');

// ─── Shared helpers ────────────────────────────────────────────────────────────
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'A valid ObjectId is required');
const currency = z.string().trim().toUpperCase().length(3).default('PKR');
const pagination = {
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().min(1).max(256).regex(/^[A-Za-z0-9_-]+$/).optional(),
};

const listQuery = (fields = {}) => z.object({ ...pagination, ...fields }).strict();

// ─── Fee Structure ─────────────────────────────────────────────────────────────

const feeStructureCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  category: z.string().trim().min(1).max(60),
  amount: z.number().positive('Amount must be positive'),
  currency: currency.optional(),
  academicSessionId: objectId,
}).strict();

const feeStructureUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).optional(),
  category: z.string().trim().min(1).max(60).optional(),
  amount: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  reason: z.string().trim().min(3).max(500).optional(),
}).strict().refine((data) => Object.keys(data).length > 0, 'At least one field is required');

const feeStructureParamsSchema = z.object({ structureId: objectId }).strict();

const feeStructureListQuerySchema = listQuery({
  academicSessionId: objectId.optional(),
  isActive: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
});

// ─── Student Fee Assignment ────────────────────────────────────────────────────

const assignFeeSchema = z.object({
  studentUserId: objectId,
  feeStructureId: objectId,
  academicSessionId: objectId.optional(),
  dueDate: z.coerce.date(),
}).strict();

const feeAssignmentParamsSchema = z.object({ assignmentId: objectId }).strict();

const feeAssignmentListQuerySchema = listQuery({
  academicSessionId: objectId.optional(),
  status: z.enum(['ACTIVE', 'CANCELLED']).optional(),
});

// ─── Invoice ───────────────────────────────────────────────────────────────────

const generateInvoiceSchema = z.object({
  studentFeeAssignmentId: objectId,
  dueDate: z.coerce.date().optional(),
}).strict();

const invoiceParamsSchema = z.object({ invoiceId: objectId }).strict();

const invoiceListQuerySchema = listQuery({
  status: z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  academicSessionId: objectId.optional(),
  studentUserId: objectId.optional(),
});

// ─── Payment ───────────────────────────────────────────────────────────────────

const initiatePaymentSchema = z.object({
  invoiceId: objectId,
  amount: z.number().positive('Amount must be positive'),
  provider: z.enum(['EASYPAISA', 'MANUAL']),
  // Section 12: Client-supplied idempotency key.
  // Max 256 chars, alphanumeric + hyphens + underscores.
  idempotencyKey: z.string().trim().min(8).max(256).regex(/^[A-Za-z0-9_-]+$/, 'idempotencyKey must contain only alphanumeric characters, hyphens, or underscores'),
}).strict();

const paymentParamsSchema = z.object({ paymentId: objectId }).strict();

const paymentListQuerySchema = listQuery({
  status: z.enum(['PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED']).optional(),
});

const invoicePaymentListParamsSchema = z.object({ invoiceId: objectId }).strict();

// ─── Webhook ───────────────────────────────────────────────────────────────────

const webhookParamsSchema = z.object({ provider: z.enum(['easypaisa']) }).strict();

// ─── Discount ─────────────────────────────────────────────────────────────────

const applyDiscountSchema = z.object({
  invoiceId: objectId,
  discountType: z.enum(['SCHOLARSHIP', 'SIBLING', 'MERIT', 'FINANCIAL_AID', 'OTHER']),
  discountAmount: z.number().positive('Discount amount must be positive'),
  reason: z.string().trim().min(3).max(500),
}).strict();

// ─── Receipt ───────────────────────────────────────────────────────────────────

const receiptParamsSchema = z.object({ receiptId: objectId }).strict();

const receiptListQuerySchema = listQuery({
  studentUserId: objectId.optional(),
});

// ─── Report ────────────────────────────────────────────────────────────────────

const reportQuerySchema = z.object({
  academicSessionId: objectId.optional(),
  studentUserId: objectId.optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
}).strict();

module.exports = {
  feeStructureCreateSchema,
  feeStructureUpdateSchema,
  feeStructureParamsSchema,
  feeStructureListQuerySchema,
  assignFeeSchema,
  feeAssignmentParamsSchema,
  feeAssignmentListQuerySchema,
  generateInvoiceSchema,
  invoiceParamsSchema,
  invoiceListQuerySchema,
  initiatePaymentSchema,
  paymentParamsSchema,
  paymentListQuerySchema,
  invoicePaymentListParamsSchema,
  webhookParamsSchema,
  applyDiscountSchema,
  receiptParamsSchema,
  receiptListQuerySchema,
  reportQuerySchema,
};
