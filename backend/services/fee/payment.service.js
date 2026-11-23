const mongoose = require('mongoose');
const Payment = require('../../models/fee/Payment');
const Invoice = require('../../models/fee/Invoice');
const FeeAudit = require('../../models/fee/FeeAudit');
const ApiError = require('../../utils/ApiError');
const { ROLES } = require('../../authorization/constants/roles.constants');
const { calculateOutstandingBalance } = require('./studentFee.service');
const { updateInvoiceStatusInternal } = require('./invoice.service');
const { getProvider } = require('./providers/provider.interface');
const { generateReceipt } = require('./receipt.service');
const notificationService = require('../notification/notification.service');

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Section 18.3: Ownership check for payment access.
const assertPaymentAccess = (actor, payment) => {
  if (actor.role === ROLES.ADMIN) return;
  if (actor.role === ROLES.STUDENT) {
    if (payment.studentUserId.toString() !== actor.sub.toString()) {
      throw new ApiError(403, 'You can only access your own payments');
    }
    return;
  }
  throw new ApiError(403, 'You do not have permission to access this payment');
};

// ─── Initiate Payment ─────────────────────────────────────────────────────────

const initiatePayment = async ({ actor, payload }) => {
  // Section 9.2 — Step 1: Identity is verified by authenticate middleware.
  // Step 2: Permission is verified by requirePermissions(PAYMENT_INITIATE) in route.

  // Step 3: Verify invoice ownership.
  const invoice = await Invoice.findById(payload.invoiceId);
  if (!invoice) throw new ApiError(404, 'Invoice not found');

  if (actor.role === ROLES.STUDENT && invoice.studentUserId.toString() !== actor.sub.toString()) {
    throw new ApiError(403, 'You can only initiate payments for your own invoices');
  }

  // Step 4: Check invoice state.
  if (invoice.status === 'PAID') {
    throw new ApiError(400, 'This invoice is already fully paid');
  }
  if (invoice.status === 'CANCELLED') {
    throw new ApiError(400, 'Cannot make a payment against a cancelled invoice');
  }

  // Step 5-6: Server-side amount validation.
  // Section 9.3: Frontend amount is NOT trusted. We compute the outstanding balance.
  const balance = await calculateOutstandingBalance(payload.invoiceId);
  if (balance.outstanding <= 0) {
    throw new ApiError(400, 'No outstanding balance on this invoice');
  }

  const requestedAmount = payload.amount;
  if (requestedAmount <= 0) {
    throw new ApiError(400, 'Payment amount must be greater than zero');
  }
  if (requestedAmount > balance.outstanding) {
    throw new ApiError(400, `Payment amount (${requestedAmount}) exceeds outstanding balance (${balance.outstanding})`);
  }

  // Step 7: Check provider availability.
  const provider = getProvider(payload.provider);

  // Step 8: Idempotency check (Section 12).
  // If a PENDING payment with the same idempotency key exists, return it.
  const idempotencyKey = payload.idempotencyKey;
  const existingPayment = await Payment.findOne({
    studentUserId: actor.sub,
    invoiceId: invoice._id,
    idempotencyKey,
  });

  if (existingPayment) {
    if (existingPayment.status === 'SUCCEEDED') {
      throw new ApiError(409, 'A payment with this idempotency key already succeeded', { code: 'PAYMENT_ALREADY_SUCCEEDED' });
    }
    if (existingPayment.status === 'PENDING') {
      // Return the existing pending payment — do not create a duplicate.
      return { payment: existingPayment, isExisting: true };
    }
    // FAILED or CANCELLED — allow re-attempt (new key should be used per best practice,
    // but we do not block it here to avoid confusing the user).
  }

  // Step 9: Create a PENDING payment record BEFORE calling the provider.
  // Section 4.6: If provider call fails, payment stays PENDING — not blindly FAILED.
  const payment = await Payment.create({
    invoiceId: invoice._id,
    studentUserId: invoice.studentUserId,
    amount: requestedAmount,
    currency: invoice.currency,
    status: 'PENDING',
    provider: payload.provider,
    providerTransactionRef: null,
    idempotencyKey,
    initiatedBy: actor.sub,
  });

  await FeeAudit.create({
    action: 'PAYMENT_INITIATED',
    targetModel: 'Payment',
    targetId: payment._id,
    performedBy: actor.sub,
    newState: { amount: payment.amount, provider: payment.provider, status: 'PENDING' },
  });

  // Step 10: Call provider.
  let providerResult;
  try {
    providerResult = await provider.initiatePayment({ payment, invoice });
  } catch (error) {
    // Section 4.6 + 23.2: Provider failure does NOT automatically fail the payment.
    // The payment stays PENDING for reconciliation if the error is uncertain.
    if (error.statusCode && error.statusCode < 500) {
      // Client-side provider error — payment can be marked FAILED.
      await Payment.findByIdAndUpdate(payment._id, { status: 'FAILED', providerStatus: error.message });
      await FeeAudit.create({
        action: 'PAYMENT_FAILED',
        targetModel: 'Payment',
        targetId: payment._id,
        performedBy: actor.sub,
        newState: { status: 'FAILED' },
        reason: error.message,
      });
      await notificationService.publishSafe({
        eventId: `payment-failed:${payment._id}:${error.message}`,
        type: 'PAYMENT_FAILED',
        title: 'Payment Failed',
        message: 'Your payment could not be completed.',
        recipientIds: [payment.studentUserId],
        referenceId: payment._id,
        referenceType: 'PAYMENT',
        actorId: actor.sub,
      });
      throw error;
    }

    // Network/timeout/5xx — mark as requiring reconciliation.
    await Payment.findByIdAndUpdate(payment._id, {
      requiresReconciliation: true,
      reconciliationNote: `Provider initiation error: ${error.message}`,
    });
    await FeeAudit.create({
      action: 'PAYMENT_REQUIRES_RECONCILIATION',
      targetModel: 'Payment',
      targetId: payment._id,
      performedBy: actor.sub,
      newState: { requiresReconciliation: true },
      reason: error.message,
    });
    throw new ApiError(503, 'Payment provider is temporarily unavailable. Your payment has been recorded as pending. Please check back later.', { code: 'PROVIDER_UNAVAILABLE' });
  }

  // Update payment with provider reference.
  const updatedPayment = await Payment.findByIdAndUpdate(
    payment._id,
    { providerTransactionRef: providerResult.providerRef },
    { new: true },
  );

  return { payment: updatedPayment, redirectUrl: providerResult.redirectUrl };
};

// ─── Handle webhook from provider ────────────────────────────────────────────
// Section 11: Webhook processing is idempotent — duplicate webhooks must not
// create duplicate financial effects.

const handleProviderWebhook = async ({ providerName, rawBody, headers }) => {
  const provider = getProvider(providerName);

  // Parse and verify webhook signature (Section 11.2).
  let webhookData;
  try {
    webhookData = await provider.parseWebhook({ rawBody, headers });
  } catch (error) {
    throw new ApiError(400, `Webhook verification failed: ${error.message}`);
  }

  const { providerRef, status: providerStatus, amount: providerAmount, currency: providerCurrency } = webhookData;

  // Find the payment by provider transaction reference.
  const payment = await Payment.findOne({ provider: providerName, providerTransactionRef: providerRef });
  if (!payment) {
    // Unknown transaction reference — log and return 200 to prevent provider retries.
    // Section 11.3: Audit the attempt but do not crash.
    return { acknowledged: true, note: 'Unknown transaction reference' };
  }

  // Section 11.3: If already SUCCEEDED, skip — idempotent.
  if (payment.status === 'SUCCEEDED') {
    return { acknowledged: true, note: 'Already processed' };
  }

  if (payment.status === 'FAILED' || payment.status === 'CANCELLED') {
    return { acknowledged: true, note: 'Payment is in terminal state' };
  }

  // Section 11.2: Verify amount and currency.
  if (Math.abs(providerAmount - payment.amount) > 0.01) {
    await Payment.findByIdAndUpdate(payment._id, {
      requiresReconciliation: true,
      reconciliationNote: `Amount mismatch: expected ${payment.amount}, provider reported ${providerAmount}`,
    });
    await FeeAudit.create({
      action: 'PAYMENT_AMOUNT_MISMATCH',
      targetModel: 'Payment',
      targetId: payment._id,
      performedBy: payment.studentUserId,
      newState: { requiresReconciliation: true, providerAmount },
      providerRef,
    });
    return { acknowledged: true, note: 'Amount mismatch — requires reconciliation' };
  }

  if (providerCurrency !== payment.currency) {
    await Payment.findByIdAndUpdate(payment._id, {
      requiresReconciliation: true,
      reconciliationNote: `Currency mismatch: expected ${payment.currency}, provider reported ${providerCurrency}`,
    });
    return { acknowledged: true, note: 'Currency mismatch — requires reconciliation' };
  }

  // Determine new status from provider.
  const isSuccess = ['SUCCESS', 'COMPLETED', 'PAID'].includes(String(providerStatus).toUpperCase());
  const isFailure = ['FAILED', 'CANCELLED', 'REJECTED', 'EXPIRED'].includes(String(providerStatus).toUpperCase());

  if (!isSuccess && !isFailure) {
    // Provider status is uncertain — keep PENDING for reconciliation.
    await Payment.findByIdAndUpdate(payment._id, {
      requiresReconciliation: true,
      reconciliationNote: `Uncertain provider status: ${providerStatus}`,
      providerStatus,
    });
    return { acknowledged: true, note: 'Uncertain status — requires reconciliation' };
  }

  if (isFailure) {
    await Payment.findByIdAndUpdate(payment._id, {
      status: 'FAILED',
      providerStatus,
    });
    await FeeAudit.create({
      action: 'PAYMENT_FAILED',
      targetModel: 'Payment',
      targetId: payment._id,
      performedBy: payment.studentUserId,
      newState: { status: 'FAILED', providerStatus },
      providerRef,
    });

    await notificationService.publishSafe({
      eventId: `payment-failed:${payment._id}:${providerStatus || 'provider-failure'}`,
      type: 'PAYMENT_FAILED',
      title: 'Payment Failed',
      message: 'Your payment could not be completed.',
      recipientIds: [payment.studentUserId],
      referenceId: payment._id,
      referenceType: 'PAYMENT',
      actorId: payment.studentUserId,
    });

    return { acknowledged: true, note: 'Payment failed per provider' };
  }

  // SUCCESS path — update payment, invoice, generate receipt atomically.
  // Section 11.4: MongoDB transaction for consistent multi-document update.
  const dbSession = await mongoose.startSession();
  try {
    await dbSession.withTransaction(async () => {
      await Payment.findByIdAndUpdate(
        payment._id,
        { status: 'SUCCEEDED', providerStatus, verifiedAt: new Date() },
        { session: dbSession },
      );

      await updateInvoiceStatusInternal({ invoiceId: payment.invoiceId, session: dbSession });

      await generateReceipt({ payment: { ...payment.toObject(), status: 'SUCCEEDED' }, session: dbSession });
    });
  } finally {
    await dbSession.endSession();
  }

  await FeeAudit.create({
    action: 'PAYMENT_SUCCEEDED',
    targetModel: 'Payment',
    targetId: payment._id,
    performedBy: payment.studentUserId,
    newState: { status: 'SUCCEEDED', providerStatus },
    providerRef,
  });

  await notificationService.publishSafe({
    eventId: `payment-succeeded:${payment._id}`,
    type: 'PAYMENT_SUCCEEDED',
    title: 'Payment Successful',
    message: 'Your payment has been confirmed.',
    recipientIds: [payment.studentUserId],
    referenceId: payment._id,
    referenceType: 'PAYMENT',
    actorId: payment.studentUserId,
  });

  return { acknowledged: true, note: 'Payment recorded successfully' };
};

// ─── Get payment by ID ────────────────────────────────────────────────────────

const getPaymentById = async ({ actor, paymentId }) => {
  const payment = await Payment.findById(paymentId).lean();
  if (!payment) throw new ApiError(404, 'Payment not found');
  assertPaymentAccess(actor, payment);
  return payment;
};

// ─── List payments for an invoice ────────────────────────────────────────────

const listPaymentsForInvoice = async ({ actor, invoiceId, filters = {} }) => {
  const invoice = await Invoice.findById(invoiceId).lean();
  if (!invoice) throw new ApiError(404, 'Invoice not found');

  if (actor.role === ROLES.STUDENT && invoice.studentUserId.toString() !== actor.sub.toString()) {
    throw new ApiError(403, 'You can only view payments for your own invoices');
  }

  const query = { invoiceId };
  if (filters.status) query.status = filters.status;

  const limit = Math.min(filters.limit ?? 50, 100);
  const items = await Payment.find(query)
    .select('-providerMetadata')
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = items.length > limit;
  if (hasMore) items.pop();

  return {
    items,
    pagination: { hasMore },
  };
};

// ─── List pending/reconciliation payments (Admin only) ────────────────────────

const listReconciliationPayments = async ({ actor, filters = {} }) => {
  if (actor.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Only administrators can access reconciliation data');
  }

  const query = { requiresReconciliation: true };
  if (filters.provider) query.provider = filters.provider;

  const limit = Math.min(filters.limit ?? 50, 100);
  const items = await Payment.find(query)
    .select('-providerMetadata')
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = items.length > limit;
  if (hasMore) items.pop();

  return { items, pagination: { hasMore } };
};

module.exports = {
  initiatePayment,
  handleProviderWebhook,
  getPaymentById,
  listPaymentsForInvoice,
  listReconciliationPayments,
};
