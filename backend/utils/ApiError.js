const DEFAULT_CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  429: 'RATE_LIMITED',
};

class ApiError extends Error {
  constructor(statusCode, message, { code, details = [] } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code || DEFAULT_CODES[statusCode] || 'APPLICATION_ERROR';
    this.details = details;
    this.isOperational = true;
  }
}

module.exports = ApiError;
