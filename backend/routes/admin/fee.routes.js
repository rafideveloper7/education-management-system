// Fee & Finance Routes — Admin-facing endpoints
// Section 22.3: Admin endpoints for fee structure management, invoices,
// payments, reconciliation, discounts, receipts, and financial reports.

const express = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermissions } = require('../../authorization/middleware/permission.middleware');
const { PERMISSIONS } = require('../../authorization/constants/permissions.constants');
const { validateRequest } = require('../../middleware/validateRequest.middleware');
const v = require('../../validators/fee/fee.validator');
const c = require('../../controllers/fee.controller');

const router = express.Router();
router.use(authenticate);

// ── Fee Structures ────────────────────────────────────────────────────────────
router.post('/fee-structures',
  requirePermissions(PERMISSIONS.FEE_STRUCTURE_CREATE),
  validateRequest({ body: v.feeStructureCreateSchema }),
  c.createFeeStructure);

router.get('/fee-structures',
  requirePermissions(PERMISSIONS.FEE_VIEW),
  validateRequest({ query: v.feeStructureListQuerySchema }),
  c.listFeeStructures);

router.get('/fee-structures/:structureId',
  requirePermissions(PERMISSIONS.FEE_VIEW),
  validateRequest({ params: v.feeStructureParamsSchema }),
  c.getFeeStructure);

router.patch('/fee-structures/:structureId',
  requirePermissions(PERMISSIONS.FEE_STRUCTURE_UPDATE),
  validateRequest({ params: v.feeStructureParamsSchema, body: v.feeStructureUpdateSchema }),
  c.updateFeeStructure);

// ── Student Fee Assignments ───────────────────────────────────────────────────
router.post('/fee-assignments',
  requirePermissions(PERMISSIONS.FEE_MANAGE),
  validateRequest({ body: v.assignFeeSchema }),
  c.assignFee);

router.get('/students/:studentUserId/fee-assignments',
  requirePermissions(PERMISSIONS.FEE_VIEW),
  validateRequest({
    params: v.feeAssignmentParamsSchema,
    query: v.feeAssignmentListQuerySchema,
  }),
  c.listStudentFeeAssignments);

// ── Invoices ──────────────────────────────────────────────────────────────────
router.post('/invoices',
  requirePermissions(PERMISSIONS.FEE_INVOICE_CREATE),
  validateRequest({ body: v.generateInvoiceSchema }),
  c.generateInvoice);

router.get('/invoices',
  requirePermissions(PERMISSIONS.FEE_INVOICE_VIEW),
  validateRequest({ query: v.invoiceListQuerySchema }),
  c.listInvoices);

router.get('/invoices/:invoiceId',
  requirePermissions(PERMISSIONS.FEE_INVOICE_VIEW),
  validateRequest({ params: v.invoiceParamsSchema }),
  c.getInvoice);

router.get('/invoices/:invoiceId/payments',
  requirePermissions(PERMISSIONS.PAYMENT_VIEW),
  validateRequest({
    params: v.invoicePaymentListParamsSchema,
    query: v.paymentListQuerySchema,
  }),
  c.listInvoicePayments);

// ── Payments ──────────────────────────────────────────────────────────────────
router.get('/payments/:paymentId',
  requirePermissions(PERMISSIONS.PAYMENT_VIEW),
  validateRequest({ params: v.paymentParamsSchema }),
  c.getPayment);

// Reconciliation — Section 24
router.get('/payments/reconciliation/pending',
  requirePermissions(PERMISSIONS.PAYMENT_RECONCILE),
  validateRequest({ query: v.paymentListQuerySchema }),
  c.listReconciliationPayments);

// ── Discounts ─────────────────────────────────────────────────────────────────
// Section 14: Discount requires explicit permission, reason, and audit trail.
router.post('/discounts',
  requirePermissions(PERMISSIONS.DISCOUNT_CREATE),
  validateRequest({ body: v.applyDiscountSchema }),
  c.applyDiscount);

// ── Receipts ──────────────────────────────────────────────────────────────────
router.get('/receipts/:receiptId',
  requirePermissions(PERMISSIONS.RECEIPT_VIEW),
  validateRequest({ params: v.receiptParamsSchema }),
  c.getReceipt);

router.get('/students/:studentUserId/receipts',
  requirePermissions(PERMISSIONS.RECEIPT_VIEW),
  validateRequest({
    params: v.feeAssignmentParamsSchema,
    query: v.receiptListQuerySchema,
  }),
  c.listStudentReceipts);

// ── Financial Reports ─────────────────────────────────────────────────────────
// Section 17: Reports require FINANCIAL_REPORT_VIEW permission.
router.get('/reports/outstanding',
  requirePermissions(PERMISSIONS.FINANCIAL_REPORT_VIEW),
  validateRequest({ query: v.reportQuerySchema }),
  c.getOutstandingFees);

router.get('/reports/summary',
  requirePermissions(PERMISSIONS.FINANCIAL_REPORT_VIEW),
  validateRequest({ query: v.reportQuerySchema }),
  c.getFinancialSummary);

module.exports = router;
