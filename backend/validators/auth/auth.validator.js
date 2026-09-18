const { z } = require('zod');

const credentialsSchema = z.object({
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const registrationSchema = credentialsSchema.extend({
  fullName: z.string().trim().min(2, 'Full name is required'),
  phone: z.string().trim().max(30).optional(),
  confirmPassword: z.string(),
}).refine((payload) => payload.confirmPassword === payload.password, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const passwordResetSchema = z.object({
  token: z.string().min(1, 'Password reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((payload) => payload.confirmPassword === payload.password, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const toValidationError = (error) => {
  const validationError = new Error(error.issues[0]?.message || 'Invalid request data');
  validationError.statusCode = 400;
  return validationError;
};

const parse = (schema, payload) => {
  const result = schema.safeParse(payload || {});

  if (!result.success) {
    throw toValidationError(result.error);
  }

  return result.data;
};

const validateCredentials = (payload) => parse(credentialsSchema, payload);

const validateRegistration = (payload) => parse(registrationSchema, payload);

const validatePasswordReset = (payload) => parse(passwordResetSchema, payload);

module.exports = {
  validateCredentials,
  validateRegistration,
  validatePasswordReset,
};
