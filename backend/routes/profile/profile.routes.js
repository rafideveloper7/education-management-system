const express = require('express');
const profileController = require('../../controllers/profile/profile.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validateRequest } = require('../../middleware/validateRequest.middleware');
const { createProfileSchemas } = require('../../validators/profile/profile.validator');

const router = express.Router();

router.get('/me', authenticate, profileController.getProfile);
router.put(
	'/me',
	authenticate,
	validateRequest({ body: (req) => createProfileSchemas(req.user.role)?.replacement }),
	profileController.replaceProfile
);
router.patch(
	'/me',
	authenticate,
	validateRequest({ body: (req) => createProfileSchemas(req.user.role)?.patch }),
	profileController.patchProfile
);

module.exports = router;
