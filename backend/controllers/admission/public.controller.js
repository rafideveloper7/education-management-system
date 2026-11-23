// Public Admission Controller
// Section 5.2: Public admission endpoints for applicants

const admissionConfigurationService = require('../../services/admission/admissionConfiguration.service');
const admissionApplicationService = require('../../services/admission/admissionApplication.service');
const admissionDocumentService = require('../../services/admission/admissionDocument.service');
const { ApiError } = require('../../utils/ApiError');

class PublicAdmissionController {
  // Get active admission configurations
  async getActiveConfigurations(req, res, next) {
    try {
      const configurations = await admissionConfigurationService.getActiveConfigurations({
        currentlyOpen: req.query.currentlyOpen === 'true',
      });
      
      return res.status(200).json({
        success: true,
        data: configurations,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Get configuration by ID
  async getConfigurationById(req, res, next) {
    try {
      const configuration = await admissionConfigurationService.getConfigurationById(
        req.validated.params.configurationId
      );
      
      return res.status(200).json({
        success: true,
        data: configuration,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Create draft application (authenticated or public)
  async createDraftApplication(req, res, next) {
    try {
      const applicantUserId = req.user?.sub || null;
      
      // Check for duplicate applications
      const duplicateCheck = await admissionApplicationService.checkDuplicateApplication(
        req.validated.body.applicantEmail,
        req.validated.body.applicantPhone,
        req.validated.body.applicantDateOfBirth,
        req.validated.body.appliedClassId
      );

      if (duplicateCheck.isDuplicate) {
        throw new ApiError(400, 'Duplicate application found', {
          duplicateApplicationId: duplicateCheck.duplicateApplication?._id,
        });
      }

      const application = await admissionApplicationService.createDraftApplication(
        req.validated.body,
        applicantUserId
      );

      return res.status(201).json({
        success: true,
        data: application,
        message: 'Draft application created successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  // Submit draft application
  async submitApplication(req, res, next) {
    try {
      const applicantUserId = req.user?.sub || null;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      const application = await admissionApplicationService.submitApplication(
        req.validated.params.applicationId,
        applicantUserId,
        ipAddress,
        userAgent
      );

      return res.status(200).json({
        success: true,
        data: application,
        message: 'Application submitted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  // Get application by ID (owner only)
  async getApplicationById(req, res, next) {
    try {
      const userId = req.user?.sub || null;
      const userRole = req.user?.role || 'PUBLIC_USER';

      const application = await admissionApplicationService.getApplicationById(
        req.validated.params.applicationId,
        userId,
        userRole
      );

      return res.status(200).json({
        success: true,
        data: application,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Update draft application (owner only)
  async updateDraftApplication(req, res, next) {
    try {
      const applicantUserId = req.user?.sub;
      if (!applicantUserId) {
        throw new ApiError(401, 'Authentication required to update application');
      }

      const application = await admissionApplicationService.updateDraftApplication(
        req.validated.params.applicationId,
        req.validated.body,
        applicantUserId
      );

      return res.status(200).json({
        success: true,
        data: application,
        message: 'Application updated successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  // Upload document for application
  async uploadDocument(req, res, next) {
    try {
      const userId = req.user?.sub || null;
      const userRole = req.user?.role || 'PUBLIC_USER';
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      if (!req.file) {
        throw new ApiError(400, 'No file uploaded');
      }

      const document = await admissionDocumentService.uploadDocument(
        req.validated.params.applicationId,
        req.file,
        req.validated.body,
        userId,
        ipAddress,
        userAgent
      );

      return res.status(201).json({
        success: true,
        data: document,
        message: 'Document uploaded successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  // Get application documents (owner only)
  async getApplicationDocuments(req, res, next) {
    try {
      const userId = req.user?.sub || null;
      const userRole = req.user?.role || 'PUBLIC_USER';

      const documents = await admissionDocumentService.listApplicationDocuments(
        req.validated.params.applicationId,
        userId,
        userRole
      );

      return res.status(200).json({
        success: true,
        data: documents,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Get document by ID (owner only)
  async getDocumentById(req, res, next) {
    try {
      const userId = req.user?.sub || null;
      const userRole = req.user?.role || 'PUBLIC_USER';

      const document = await admissionDocumentService.getDocumentById(
        req.validated.params.documentId,
        userId,
        userRole
      );

      return res.status(200).json({
        success: true,
        data: document,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Replace document (owner only)
  async replaceDocument(req, res, next) {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new ApiError(401, 'Authentication required to replace document');
      }

      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      if (!req.file) {
        throw new ApiError(400, 'No file uploaded');
      }

      const document = await admissionDocumentService.replaceDocument(
        req.validated.params.documentId,
        req.file,
        req.validated.body,
        userId,
        ipAddress,
        userAgent
      );

      return res.status(200).json({
        success: true,
        data: document,
        message: 'Document replaced successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  // Delete document (owner only)
  async deleteDocument(req, res, next) {
    try {
      const userId = req.user?.sub;
      const userRole = req.user?.role;
      
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const result = await admissionDocumentService.deleteDocument(
        req.validated.params.documentId,
        userId,
        userRole
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Check eligibility
  async checkEligibility(req, res, next) {
    try {
      const result = await admissionConfigurationService.validateEligibility(
        req.validated.params.configurationId,
        req.validated.body
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Validate application data
  async validateApplication(req, res, next) {
    try {
      // Check for duplicates
      const duplicateCheck = await admissionApplicationService.checkDuplicateApplication(
        req.validated.body.applicantEmail,
        req.validated.body.applicantPhone,
        req.validated.body.applicantDateOfBirth,
        req.validated.body.appliedClassId
      );

      // Check eligibility
      const eligibilityCheck = await admissionConfigurationService.validateEligibility(
        req.validated.body.admissionConfigurationId,
        req.validated.body
      );

      return res.status(200).json({
        success: true,
        data: {
          isDuplicate: duplicateCheck.isDuplicate,
          duplicateApplication: duplicateCheck.isDuplicate ? duplicateCheck.duplicateApplication : null,
          isEligible: eligibilityCheck.eligible,
          eligibilityErrors: eligibilityCheck.errors,
          configuration: eligibilityCheck.configuration,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new PublicAdmissionController();