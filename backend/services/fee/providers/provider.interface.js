// Payment Provider Interface — Documentation Only
//
// Section 10.2: Strategy + Adapter pattern.
// This file documents the expected interface for all payment provider adapters.
// Each adapter must expose the methods listed below.
//
// Adding a new provider (Section 10.5):
//   1. Create <providerName>.adapter.js in this directory.
//   2. Implement the interface methods below.
//   3. Add the provider name to Payment.provider enum in Payment.js.
//   4. Register the adapter in providerRegistry below.
//   5. Obtain official provider documentation and credentials.
//   6. Test with sandbox before declaring production-ready.
//
// Interface contract:
//
// initiatePayment({ payment, invoice, student }) → Promise<{ providerRef, redirectUrl, providerRawResponse }>
//   - Creates a payment session/request with the provider.
//   - Returns provider's transaction reference and any redirect URL if needed.
//   - DOES NOT mark payment as SUCCEEDED — provider must confirm separately.
//
// verifyPayment({ providerRef, payment }) → Promise<{ verified: boolean, providerStatus, providerRawResponse }>
//   - Queries the provider for transaction status.
//   - Returns verified=true ONLY if provider confirms SUCCEEDED.
//   - Must validate amount and currency match.
//
// parseWebhook({ rawBody, headers }) → Promise<{ providerRef, status, amount, currency, providerRawResponse }>
//   - Parses and validates the incoming webhook from the provider.
//   - Verifies signature/authenticity per provider's official documentation.
//   - Throws ApiError(400) if signature is invalid or payload is malformed.
//
// isAvailable() → boolean
//   - Returns true if this provider is configured and enabled.
//
// supportsRefund() → boolean
//   - Returns true if the provider supports programmatic refunds.
//   - Section 10.4: Never fake refund support.

const ApiError = require('../../../utils/ApiError');

// Registry of available providers.
// Each key matches the Payment.provider enum value.
const PROVIDER_REGISTRY = {
  EASYPAISA: require('./easypaisa.adapter'),
  // Future providers added here:
  // JAZZCASH: require('./jazzcash.adapter'),
};

const getProvider = (providerName) => {
  const adapter = PROVIDER_REGISTRY[providerName];
  if (!adapter) {
    throw new ApiError(400, `Payment provider '${providerName}' is not supported`);
  }
  if (!adapter.isAvailable()) {
    throw new ApiError(503, `Payment provider '${providerName}' is currently unavailable`);
  }
  return adapter;
};

const listAvailableProviders = () => Object.entries(PROVIDER_REGISTRY)
  .filter(([, adapter]) => adapter.isAvailable())
  .map(([name, adapter]) => ({
    name,
    supportsRefund: adapter.supportsRefund(),
  }));

module.exports = { getProvider, listAvailableProviders };
