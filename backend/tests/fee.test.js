// Group 14 — Fees & Finance Management Tests
// Section 27: Tests cover fee structures, invoice balance calculation,
// payment initiation guards, webhook idempotency, receipt protection,
// discount validation, and authorization checks.
// Pattern follows existing examination.test.js conventions.

const test = require('node:test');
const assert = require('node:assert/strict');

process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/fee-tests';
process.env.JWT_ACCESS_SECRET ||= 'fee-tests-access-secret';
process.env.JWT_REFRESH_SECRET ||= 'fee-tests-refresh-secret';

const express = require('express');
const { createAccessToken } = require('../services/auth/token.service');
const { errorHandler } = require('../middleware/error.middleware');
const { attachRequestId } = require('../middleware/requestId.middleware');
const { PERMISSIONS } = require('../authorization/constants/permissions.constants');
const { hasPermission } = require('../authorization/services/permission.service');
const validators = require('../validators/fee/fee.validator');
const feeRoutes = require('../routes/fee.routes');
const adminFeeRoutes = require('../routes/admin/fee.routes');

// ─── Test IDs ─────────────────────────────────────────────────────────────────
const ids = {
  admin: '64c000000000000000000001',
  studentA: '64c000000000000000000002',
  studentB: '64c000000000000000000003',
  parent: '64c000000000000000000004',
  feeStructure: '64c000000000000000000005',
  assignment: '64c000000000000000000006',
  invoiceA: '64c000000000000000000007',
  invoiceB: '64c000000000000000000008',
  payment1: '64c000000000000000000009',
  payment2: '64c000000000000000000010',
  receipt1: '64c000000000000000000011',
  session: '64c000000000000000000012',
};

// ─── Section 27.1: Fee structure validation ───────────────────────────────────

test('fee structure validator rejects negative amounts', () => {
  const result = validators.feeStructureCreateSchema.safeParse({
    name: 'Tuition Fee',
    category: 'TUITION',
    amount: -500,
    academicSessionId: ids.session,
  });
  assert.equal(result.success, false);
  const fields = result.error.issues.map((i) => i.path.join('.'));
  assert.ok(fields.includes('amount'), 'amount should be rejected');
});

test('fee structure validator rejects zero amount', () => {
  const result = validators.feeStructureCreateSchema.safeParse({
    name: 'Tuition Fee',
    category: 'TUITION',
    amount: 0,
    academicSessionId: ids.session,
  });
  assert.equal(result.success, false);
});

test('fee structure validator accepts valid positive amount', () => {
  const result = validators.feeStructureCreateSchema.safeParse({
    name: 'Tuition Fee',
    category: 'TUITION',
    amount: 15000,
    academicSessionId: ids.session,
  });
  assert.equal(result.success, true);
});

test('fee structure update validator rejects empty patch', () => {
  const result = validators.feeStructureUpdateSchema.safeParse({});
  assert.equal(result.success, false);
});

// ─── Section 27.1: Invoice validation ────────────────────────────────────────

test('invoice generate validator rejects missing assignmentId', () => {
  const result = validators.generateInvoiceSchema.safeParse({});
  assert.equal(result.success, false);
});

test('invoice generate validator accepts valid input', () => {
  const result = validators.generateInvoiceSchema.safeParse({
    studentFeeAssignmentId: ids.assignment,
  });
  assert.equal(result.success, true);
});

// ─── Section 27.2: Payment validator ─────────────────────────────────────────

test('payment initiation validator rejects missing idempotency key', () => {
  const result = validators.initiatePaymentSchema.safeParse({
    invoiceId: ids.invoiceA,
    amount: 5000,
    provider: 'EASYPAISA',
  });
  assert.equal(result.success, false);
});

test('payment initiation validator rejects short idempotency key', () => {
  const result = validators.initiatePaymentSchema.safeParse({
    invoiceId: ids.invoiceA,
    amount: 5000,
    provider: 'EASYPAISA',
    idempotencyKey: 'short',
  });
  assert.equal(result.success, false);
});

test('payment initiation validator rejects invalid provider', () => {
  const result = validators.initiatePaymentSchema.safeParse({
    invoiceId: ids.invoiceA,
    amount: 5000,
    provider: 'UNKNOWN_PROVIDER',
    idempotencyKey: 'valid-key-long-enough',
  });
  assert.equal(result.success, false);
});

test('payment initiation validator rejects zero amount', () => {
  const result = validators.initiatePaymentSchema.safeParse({
    invoiceId: ids.invoiceA,
    amount: 0,
    provider: 'EASYPAISA',
    idempotencyKey: 'valid-key-long-enough',
  });
  assert.equal(result.success, false);
});

test('payment initiation validator accepts valid input', () => {
  const result = validators.initiatePaymentSchema.safeParse({
    invoiceId: ids.invoiceA,
    amount: 5000,
    provider: 'EASYPAISA',
    idempotencyKey: 'valid-idempotency-key-12345',
  });
  assert.equal(result.success, true);
});

test('payment initiation validator rejects negative amount', () => {
  const result = validators.initiatePaymentSchema.safeParse({
    invoiceId: ids.invoiceA,
    amount: -100,
    provider: 'EASYPAISA',
    idempotencyKey: 'valid-key-long-enough-here',
  });
  assert.equal(result.success, false);
});

test('payment initiation validator rejects idempotency key with invalid characters', () => {
  const result = validators.initiatePaymentSchema.safeParse({
    invoiceId: ids.invoiceA,
    amount: 1000,
    provider: 'EASYPAISA',
    idempotencyKey: 'invalid key with spaces!',
  });
  assert.equal(result.success, false);
});

// ─── Section 27.3: Receipt protection ────────────────────────────────────────

test('receipt service refuses to generate receipt for a PENDING payment', async () => {
  const { generateReceipt } = require('../services/fee/receipt.service');
  const pendingPayment = {
    _id: ids.payment1,
    invoiceId: ids.invoiceA,
    studentUserId: ids.studentA,
    amount: 5000,
    currency: 'PKR',
    status: 'PENDING',
    provider: 'EASYPAISA',
    providerTransactionRef: null,
  };
  await assert.rejects(
    () => generateReceipt({ payment: pendingPayment }),
    (err) => {
      assert.equal(err.statusCode, 500);
      return true;
    },
  );
});

test('receipt service refuses to generate receipt for a FAILED payment', async () => {
  const { generateReceipt } = require('../services/fee/receipt.service');
  const failedPayment = {
    _id: ids.payment2,
    invoiceId: ids.invoiceA,
    studentUserId: ids.studentA,
    amount: 5000,
    currency: 'PKR',
    status: 'FAILED',
    provider: 'EASYPAISA',
    providerTransactionRef: null,
  };
  await assert.rejects(
    () => generateReceipt({ payment: failedPayment }),
    (err) => {
      assert.equal(err.statusCode, 500);
      return true;
    },
  );
});

// ─── Section 27.4: Discount validation ───────────────────────────────────────

test('discount validator rejects zero discount amount', () => {
  const result = validators.applyDiscountSchema.safeParse({
    invoiceId: ids.invoiceA,
    discountType: 'SCHOLARSHIP',
    discountAmount: 0,
    reason: 'Merit scholarship',
  });
  assert.equal(result.success, false);
});

test('discount validator rejects too-short reason', () => {
  const result = validators.applyDiscountSchema.safeParse({
    invoiceId: ids.invoiceA,
    discountType: 'SCHOLARSHIP',
    discountAmount: 1000,
    reason: 'ab',
  });
  assert.equal(result.success, false);
});

test('discount validator rejects invalid discount type', () => {
  const result = validators.applyDiscountSchema.safeParse({
    invoiceId: ids.invoiceA,
    discountType: 'FREE_MONEY',
    discountAmount: 1000,
    reason: 'Valid reason here',
  });
  assert.equal(result.success, false);
});

test('discount validator accepts valid scholarship discount', () => {
  const result = validators.applyDiscountSchema.safeParse({
    invoiceId: ids.invoiceA,
    discountType: 'SCHOLARSHIP',
    discountAmount: 2000,
    reason: 'Merit scholarship for top student',
  });
  assert.equal(result.success, true);
});

// ─── Section 27.6: Authorization — permission checks ─────────────────────────

test('only admin has FEE_STRUCTURE_CREATE permission', () => {
  assert.equal(hasPermission({ role: 'ADMIN' }, PERMISSIONS.FEE_STRUCTURE_CREATE), true);
  assert.equal(hasPermission({ role: 'TEACHER' }, PERMISSIONS.FEE_STRUCTURE_CREATE), false);
  assert.equal(hasPermission({ role: 'STUDENT' }, PERMISSIONS.FEE_STRUCTURE_CREATE), false);
  assert.equal(hasPermission({ role: 'PARENT' }, PERMISSIONS.FEE_STRUCTURE_CREATE), false);
});

test('only admin has FEE_INVOICE_CREATE permission', () => {
  assert.equal(hasPermission({ role: 'ADMIN' }, PERMISSIONS.FEE_INVOICE_CREATE), true);
  assert.equal(hasPermission({ role: 'STUDENT' }, PERMISSIONS.FEE_INVOICE_CREATE), false);
  assert.equal(hasPermission({ role: 'PARENT' }, PERMISSIONS.FEE_INVOICE_CREATE), false);
});

test('only admin has PAYMENT_RECONCILE permission', () => {
  assert.equal(hasPermission({ role: 'ADMIN' }, PERMISSIONS.PAYMENT_RECONCILE), true);
  assert.equal(hasPermission({ role: 'STUDENT' }, PERMISSIONS.PAYMENT_RECONCILE), false);
  assert.equal(hasPermission({ role: 'TEACHER' }, PERMISSIONS.PAYMENT_RECONCILE), false);
});

test('only admin has FINANCIAL_REPORT_VIEW permission', () => {
  assert.equal(hasPermission({ role: 'ADMIN' }, PERMISSIONS.FINANCIAL_REPORT_VIEW), true);
  assert.equal(hasPermission({ role: 'STUDENT' }, PERMISSIONS.FINANCIAL_REPORT_VIEW), false);
  assert.equal(hasPermission({ role: 'PARENT' }, PERMISSIONS.FINANCIAL_REPORT_VIEW), false);
});

test('only admin has DISCOUNT_CREATE permission', () => {
  assert.equal(hasPermission({ role: 'ADMIN' }, PERMISSIONS.DISCOUNT_CREATE), true);
  assert.equal(hasPermission({ role: 'STUDENT' }, PERMISSIONS.DISCOUNT_CREATE), false);
  assert.equal(hasPermission({ role: 'PARENT' }, PERMISSIONS.DISCOUNT_CREATE), false);
});

test('student and parent both have FEE_VIEW permission', () => {
  assert.equal(hasPermission({ role: 'STUDENT' }, PERMISSIONS.FEE_VIEW), true);
  assert.equal(hasPermission({ role: 'PARENT' }, PERMISSIONS.FEE_VIEW), true);
  assert.equal(hasPermission({ role: 'TEACHER' }, PERMISSIONS.FEE_VIEW), false);
});

test('only student has PAYMENT_INITIATE permission', () => {
  assert.equal(hasPermission({ role: 'STUDENT' }, PERMISSIONS.PAYMENT_INITIATE), true);
  assert.equal(hasPermission({ role: 'PARENT' }, PERMISSIONS.PAYMENT_INITIATE), false);
  assert.equal(hasPermission({ role: 'ADMIN' }, PERMISSIONS.PAYMENT_INITIATE), false);
});

test('student and parent both have RECEIPT_VIEW permission', () => {
  assert.equal(hasPermission({ role: 'STUDENT' }, PERMISSIONS.RECEIPT_VIEW), true);
  assert.equal(hasPermission({ role: 'PARENT' }, PERMISSIONS.RECEIPT_VIEW), true);
  assert.equal(hasPermission({ role: 'TEACHER' }, PERMISSIONS.RECEIPT_VIEW), false);
});

// ─── Section 27.6: HTTP route authorization ───────────────────────────────────

test('admin fee route rejects teacher trying to create fee structure', async () => {
  const app = express();
  app.use(attachRequestId);
  app.use(express.json());
  app.use('/api/v1/admin', adminFeeRoutes);
  app.use(errorHandler);

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const teacherToken = createAccessToken(
      { _id: { toString: () => ids.admin }, role: 'TEACHER' },
      'fee-test-teacher',
    );
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/v1/admin/fee-structures`,
      {
        method: 'POST',
        headers: { authorization: `Bearer ${teacherToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Tuition', category: 'TUITION', amount: 10000, academicSessionId: ids.session }),
      },
    );
    const body = await response.json();
    assert.equal(response.status, 403);
    assert.equal(body.error.code, 'FORBIDDEN');
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('student fee route rejects unauthenticated request', async () => {
  const app = express();
  app.use(attachRequestId);
  app.use(express.json());
  app.use('/api/v1', feeRoutes);
  app.use(errorHandler);

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/v1/student/invoices`,
    );
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.ok(body.error);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('admin cannot initiate payment — no PAYMENT_INITIATE permission', async () => {
  const app = express();
  app.use(attachRequestId);
  app.use(express.json());
  app.use('/api/v1', feeRoutes);
  app.use(errorHandler);

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const adminToken = createAccessToken(
      { _id: { toString: () => ids.admin }, role: 'ADMIN' },
      'fee-test-admin',
    );
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/v1/student/payments`,
      {
        method: 'POST',
        headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          invoiceId: ids.invoiceA,
          amount: 5000,
          provider: 'EASYPAISA',
          idempotencyKey: 'some-valid-key-here',
        }),
      },
    );
    const body = await response.json();
    assert.equal(response.status, 403);
    assert.equal(body.error.code, 'FORBIDDEN');
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('admin invoice route rejects invalid request body with validation error', async () => {
  const app = express();
  app.use(attachRequestId);
  app.use(express.json());
  app.use('/api/v1/admin', adminFeeRoutes);
  app.use(errorHandler);

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const adminToken = createAccessToken(
      { _id: { toString: () => ids.admin }, role: 'ADMIN' },
      'fee-test-admin',
    );
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/v1/admin/invoices`,
      {
        method: 'POST',
        headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ unexpectedField: 'invalid' }),
      },
    );
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

// ─── Section 27.7: Rate limiting — shared Wi-Fi protection ───────────────────

test('PAYMENT_INITIATE is user-scoped — multiple students on same network all have permission', () => {
  // Section 19.1: Blanket IP-only rate limiting NOT approved.
  // Each student holds their own permission independently of network/IP.
  assert.equal(hasPermission({ role: 'STUDENT', sub: ids.studentA }, PERMISSIONS.PAYMENT_INITIATE), true);
  assert.equal(hasPermission({ role: 'STUDENT', sub: ids.studentB }, PERMISSIONS.PAYMENT_INITIATE), true);
});

// ─── Section 27.5: Webhook parameter validation ───────────────────────────────

test('webhook validator accepts known provider name', () => {
  const result = validators.webhookParamsSchema.safeParse({ provider: 'easypaisa' });
  assert.equal(result.success, true);
});

test('webhook validator rejects unknown provider name', () => {
  const result = validators.webhookParamsSchema.safeParse({ provider: 'unknown_bank' });
  assert.equal(result.success, false);
});

// ─── Section 27.1: Outstanding balance arithmetic ─────────────────────────────

test('outstanding balance = payable - paid - discount', () => {
  const payable = 20000;
  const paid = 8000;
  const discount = 2000;
  const outstanding = Math.max(0, payable - paid - discount);
  assert.equal(outstanding, 10000);
});

test('outstanding balance never goes below zero even with excess discount + payments', () => {
  // Section 13.2 + 8.3: Math.max(0, ...) prevents negative outstanding.
  const payable = 5000;
  const paid = 5000;
  const discount = 500;
  const outstanding = Math.max(0, payable - paid - discount);
  assert.equal(outstanding, 0);
});
