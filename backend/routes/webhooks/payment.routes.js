// Payment Webhook Routes
//
// Section 22.2: Webhook endpoint is NOT protected by the standard
// authenticate middleware — provider webhooks do not carry a Bearer token.
// Instead, signature verification happens inside the provider adapter
// (parseWebhook) using the provider's documented HMAC/secret mechanism.
//
// Section 11.1: Frontend "Payment Successful" is NOT trusted.
// Only verified provider webhooks update payment state.
//
// Section 11.3: Always return HTTP 200 to the provider after acknowledging
// the webhook, even if we detect a duplicate. Returning non-200 causes
// providers to retry indefinitely.

const express = require('express');
const { validateRequest } = require('../../middleware/validateRequest.middleware');
const v = require('../../validators/fee/fee.validator');
const c = require('../../controllers/fee.controller');

const router = express.Router();

// POST /api/v1/webhooks/payments/:provider
// :provider must be one of the supported provider names (e.g. easypaisa).
// Signature verification is done inside the adapter's parseWebhook().
router.post('/payments/:provider',
  validateRequest({ params: v.webhookParamsSchema }),
  c.handleWebhook);

module.exports = router;
