const express = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermissions } = require('../../authorization/middleware/permission.middleware');
const { PERMISSIONS } = require('../../authorization/constants/permissions.constants');
const { validateRequest } = require('../../middleware/validateRequest.middleware');
const validators = require('../../validators/assignment/assignment.validator');
const controller = require('../../controllers/assignment.controller');

const router = express.Router();
router.use(authenticate, requirePermissions(PERMISSIONS.UPLOAD_POLICY_MANAGE));
router.get('/upload-limits', controller.getUploadPolicy);
router.patch('/upload-limits', validateRequest({ body: validators.uploadPolicySchema }), controller.updateUploadPolicy);

module.exports = router;