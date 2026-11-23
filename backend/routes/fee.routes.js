// Fee & Finance Routes — Student-facing endpoints
// All routes require authentication.
// Section 22.1: Student endpoints for invoices, payments, receipts.

const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermissions } = require('../authorization/middleware/permission.middleware');
const { PERMISSIONS } = require('../authorization/constants/permissions.constants');
const { validateRequest } = require('../middleware/validateRequest.middleware');
const v = require('../validators/fee/fee.validator');
const c = require('../controllers/fee.controller');

const router = express.Router();
router.use(authenticate);

// ── Student: Fee structures (view active only) ────────────────────────────────
router.get('/student/fee-structures',
  requirePermissions(PERMISSIONS.FEE_VIEW),
  validateRequest({ query: v.feeStructureListQuerySchema }),
  c.listFeeStructures);

// ── Student: My fee assignments ───────────────────────────────────────────────
router.get('/student/fee-assignments',
  requirePermissions(PERMISSIONS.FEE_VIEW),
  validateRequest({ query: v.feeAssignmentListQuerySchema }),
  c.listMyFeeAssignments);

// ── Student: Invoices ─────────────────────────────────────────────────────────
router.get('/student/invoices',
  requirePermissions(PERMISSIONS.FEE_INVOICE_VIEW),
  validateRequest({ query: v.invoiceListQuerySchema }),
  c.listMyInvoices);

router.get('/student/invoices/:invoiceId',
  requirePermissions(PERMISSIONS.FEE_INVOICE_VIEW),
  validateRequest({ params: v.invoiceParamsSchema }),
  c.getInvoice);

// ── Student: Payments ─────────────────────────────────────────────────────────
// Section 9.2: Payment initiation with idempotency key required.
router.post('/student/payments',
  requirePermissions(PERMISSIONS.PAYMENT_INITIATE),
  validateRequest({ body: v.initiatePaymentSchema }),
  c.initiatePayment);

router.get('/student/payments/:paymentId',
  requirePermissions(PERMISSIONS.PAYMENT_VIEW),
  validateRequest({ params: v.paymentParamsSchema }),
  c.getPayment);

router.get('/student/invoices/:invoiceId/payments',
  requirePermissions(PERMISSIONS.PAYMENT_VIEW),
  validateRequest({ params: v.invoicePaymentListParamsSchema, query: v.paymentListQuerySchema }),
  c.listInvoicePayments);

// ── Student: Receipts ─────────────────────────────────────────────────────────
router.get('/student/receipts',
  requirePermissions(PERMISSIONS.RECEIPT_VIEW),
  validateRequest({ query: v.receiptListQuerySchema }),
  c.listMyReceipts);

router.get('/student/receipts/:receiptId',
  requirePermissions(PERMISSIONS.RECEIPT_VIEW),
  validateRequest({ params: v.receiptParamsSchema }),
  c.getReceipt);

module.exports = router;
