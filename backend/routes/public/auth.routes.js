const express = require('express');

const authController = require('../../controllers/public/auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validateRequest } = require('../../middleware/validateRequest.middleware');
const {
	credentialsSchema,
	forgotPasswordSchema,
	logoutSchema,
	passwordResetSchema,
	refreshTokenSchema,
	registrationSchema,
} = require('../../validators/auth/auth.validator');
const {
	loginRateLimiter,
	passwordRecoveryRateLimiter,
	registrationRateLimiter,
} = require('../../middleware/rateLimit.middleware');

const router = express.Router();

router.post('/register', registrationRateLimiter, validateRequest({ body: registrationSchema }), authController.register);
router.post('/login', loginRateLimiter, validateRequest({ body: credentialsSchema }), authController.login);
router.post('/refresh', validateRequest({ body: refreshTokenSchema }), authController.refresh);
router.post('/logout', validateRequest({ body: logoutSchema }), authController.logout);
router.post(
	'/forgot-password',
	passwordRecoveryRateLimiter,
	validateRequest({ body: forgotPasswordSchema }),
	authController.forgotPassword
);
router.post(
	'/reset-password',
	passwordRecoveryRateLimiter,
	validateRequest({ body: passwordResetSchema }),
	authController.resetPassword
);
router.get('/me', authenticate, authController.me);

module.exports = router;
