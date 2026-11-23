// Easypaisa Payment Provider Adapter
//
// STATUS: STUB — Not production-ready.
//
// Section 10.6 + Section 26: Official Easypaisa API documentation, sandbox
// credentials, and webhook secrets are required before this adapter can be
// completed. The methods below throw descriptive errors to prevent accidental
// use in production without proper configuration.
//
// Required from Easypaisa official documentation before completing this adapter:
//   - Authentication method (HMAC, OAuth, API key)
//   - API endpoints (sandbox + production)
//   - Required request fields and headers
//   - Supported currencies
//   - Transaction reference format
//   - Callback/webhook behavior and signature algorithm
//   - Status lookup mechanism
//   - Retry and timeout behavior
//   - Refund API support
//   - Rate limits
//
// To complete integration:
//   1. Obtain Easypaisa merchant credentials.
//   2. Read official Easypaisa Developer documentation.
//   3. Replace the stub implementations with actual API calls.
//   4. Implement signature verification in parseWebhook().
//   5. Test with Easypaisa sandbox.
//   6. Document all decisions per Section 28.

const env = require('../../../config/env');
const ApiError = require('../../../utils/ApiError');

const isAvailable = () => {
  // Provider is available only when credentials are configured.
  return Boolean(
    env.EASYPAISA_STORE_ID
    && env.EASYPAISA_HASH_KEY
    && env.EASYPAISA_ENABLED === 'true',
  );
};

const supportsRefund = () => {
  // Update to true once Easypaisa refund API is confirmed and implemented.
  return false;
};

const initiatePayment = async ({ payment, invoice }) => {
  // TODO: Implement using official Easypaisa API documentation.
  // Required steps:
  //   1. Build the payment request per Easypaisa spec.
  //   2. Generate required HMAC signature using EASYPAISA_HASH_KEY.
  //   3. Call Easypaisa initiation endpoint.
  //   4. Handle timeout explicitly — do not assume failure on timeout.
  //   5. Return { providerRef, redirectUrl, providerRawResponse }.
  throw new ApiError(503, 'Easypaisa integration is not yet configured. Merchant credentials and API documentation are required.');
};

const verifyPayment = async ({ providerRef, payment }) => {
  // TODO: Implement status lookup using official Easypaisa API.
  // Required steps:
  //   1. Call Easypaisa transaction status endpoint with providerRef.
  //   2. Validate response signature.
  //   3. Compare amount and currency with our payment record.
  //   4. Return { verified: boolean, providerStatus, providerRawResponse }.
  throw new ApiError(503, 'Easypaisa integration is not yet configured. Merchant credentials and API documentation are required.');
};

const parseWebhook = async ({ rawBody, headers }) => {
  // TODO: Implement per Easypaisa webhook documentation.
  // Required steps:
  //   1. Validate webhook signature using EASYPAISA_HASH_KEY.
  //   2. If signature is invalid, throw ApiError(400, 'Invalid webhook signature').
  //   3. Parse providerRef, status, amount, currency from payload.
  //   4. Return { providerRef, status, amount, currency, providerRawResponse }.
  throw new ApiError(503, 'Easypaisa webhook handler is not yet implemented. Provider documentation required.');
};

module.exports = {
  isAvailable,
  supportsRefund,
  initiatePayment,
  verifyPayment,
  parseWebhook,
};
