const { z } = require('zod');

const credentialsSchema = z.object({
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
}).strict();

const registrationSchema = credentialsSchema.extend({
  fullName: z.string().trim().min(2, 'Full name is required'),
  phone: z.string().trim().max(30).optional(),
  confirmPassword: z.string(),
}).refine((payload) => payload.confirmPassword === payload.password, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).strict();

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
}).strict();

const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token must not be empty').optional(),
}).strict();

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('A valid email is required'),
}).strict();

const passwordResetSchema = z.object({
  token: z.string().min(1, 'Password reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((payload) => payload.confirmPassword === payload.password, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).strict();

module.exports = {
  credentialsSchema,
  registrationSchema,
  refreshTokenSchema,
  logoutSchema,
  forgotPasswordSchema,
  passwordResetSchema,
};
