const SENSITIVE_FIELD = /password|token|secret|authorization|cookie|credential|api[-_]?key/i;

const sanitizeAuditValue = (value) => {
  if (Array.isArray(value)) return value.map(sanitizeAuditValue);
  if (!value || typeof value !== 'object' || value instanceof Date || Buffer.isBuffer(value)) {
    return value;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SENSITIVE_FIELD.test(key))
      .map(([key, nestedValue]) => [key, sanitizeAuditValue(nestedValue)])
  );
};

module.exports = { sanitizeAuditValue };
