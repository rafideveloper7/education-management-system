// Admin Admission Controller
// Section 5.3, 5.5-5.6, 5.10: Admin admission management

const admissionConfigurationService = require('../../services/admission/admissionConfiguration.service');
const admissionApplicationService = require('../../services/admission/admissionApplication.service');
const admissionDocumentService = require('../../services/admission/admissionDocument.service');
const admissionWorkflowService = require('../../services/admission/admissionWorkflow.service');
const admissionOnboardingService = require('../../services/admission/admissionOnboarding.service');
const admissionReportService = require('../../services/admission/admissionReport.service');
const { ApiError } = require('../../utils/ApiError');

class AdminAdmissionController {
  // Configuration Management
  async createConfiguration(req, res, next) {
    try {
      const configuration = await admissionConfigurationService.createConfiguration(
        req.validated.body,
        req.user.sub
      );

      return res.status(201).json({
        success: true,
        data: configuration,
        message: 'Admission configuration created successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateConfiguration(req, res, next) {
    try {
      const configuration = await admissionConfigurationService.updateConfiguration(
        req.validated.params.configurationId,
        req.validated.body,
        req.user.sub
      );

      return res.status(200).json({
        success: true,
        data: configuration,
        message: 'Admission configuration updated successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  async archiveConfiguration(req, res, next) {
    try {
      const configuration = await admissionConfigurationService.archiveConfiguration(
        req.validated.params.configurationId,
        req.user.sub
      );

      return res.status(200).json({
        success: true,
        data: configuration,
        message: 'Admission configuration archived successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  // Application Management
  async listApplications(req, res, next) {
    try {
      const result = await admissionApplicationService.listApplications(req.validated.query);

      return res.status(200).json({
        success: true,
        data: result.applications,
        pagination: result.pagination,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getApplicationDetails(req, res, next) {
    try {
      const application = await admissionApplicationService.getApplicationById(
        req.validated.params.applicationId,
        req.user.sub,
        req.user.role
      );

      return res.status(200).json({
        success: true,
        data: application,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Document Management
  async verifyDocument(req, res, next) {
    try {
      const document = await admissionDocumentService.verifyDocument(
        req.validated.params.documentId,
        req.user.sub,
        req.validated.body.verificationNotes,
        req.validated.body.status
      );

      return res.status(200).json({
        success: true,
        data: document,
        message: 'Document verification completed',
      });
    } catch (error) {
      return next(error);
    }
  }

  async getDocumentDetails(req, res, next) {
    try {
      const document = await admissionDocumentService.getDocumentById(
        req.validated.params.documentId,
        req.user.sub,
        req.user.role
      );

      return res.status(200).json({
        success: true,
        data: document,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Workflow Management
  async startReview(req, res, next) {
    try {
      const application = await admissionWorkflowService.startReview(
        req.validated.params.applicationId,
        req.user.sub,
        req.validated.body.reviewNotes
      );

      return res.status(200).json({
        success: true,
        data: application,
        message: 'Application review started',
      });
    } catch (error) {
      return next(error);
    }
  }

  async requestMoreInfo(req, res, next) {
    try {
      const application = await admissionWorkflowService.requestMoreInfo(
        req.validated.params.applicationId,
        req.user.sub,
        req.validated.body.requestNotes
      );

      return res.status(200).json({
        success: true,
        data: application,
        message: 'More information requested from applicant',
      });
    } catch (error) {
      return next(error);
    }
  }

  async approveApplication(req, res, next) {
    try {
      const application = await admissionWorkflowService.approveApplication(
        req.validated.params.applicationId,
        req.user.sub,
        req.validated.body.approvalNotes
      );

      return res.status(200).json({
        success: true,
        data: application,
        message: 'Application approved successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  async rejectApplication(req, res, next) {
    try {
      const application = await admissionWorkflowService.rejectApplication(
        req.validated.params.applicationId,
        req.user.sub,
        req.validated.body.rejectionNotes
      );

      return res.status(200).json({
        success: true,
        data: application,
        message: 'Application rejected',
      });
    } catch (error) {
      return next(error);
    }
  }

  async completeReview(req, res, next) {
    try {
      const application = await admissionWorkflowService.completeReview(
        req.validated.params.applicationId,
        req.user.sub,
        req.validated.body.reviewNotes
      );

      return res.status(200).json({
        success: true,
        data: application,
        message: 'Review completed',
      });
    } catch (error) {
      return next(error);
    }
  }

  // Onboarding Management
  async onboardStudent(req, res, next) {
    try {
      const result = await admissionOnboardingService.onboardStudent(
        req.validated.params.applicationId,
        req.user.sub,
        req.validated.body.academicSessionId,
        req.validated.body.classId,
        req.validated.body.sectionId
      );

      return res.status(200).json({
        success: true,
        data: {
          student: result.studentUser,
          profile: result.studentProfile,
          application: result.application,
          tempPassword: result.tempPassword,
        },
        message: 'Student onboarded successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  async linkParent(req, res, next) {
    try {
      const result = await admissionOnboardingService.linkParentToStudent(
        req.validated.params.studentId,
        req.validated.body,
        req.user.sub
      );

      return res.status(200).json({
        success: true,
        data: {
          parent: result.parentUser,
          profile: result.parentProfile,
          relationship: result.parentStudent,
          tempPassword: result.tempPassword,
        },
        message: 'Parent linked successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  async enrollStudent(req, res, next) {
    try {
      const enrollment = await admissionOnboardingService.enrollStudent(
        req.validated.params.studentId,
        req.validated.body,
        req.user.sub
      );

      return res.status(200).json({
        success: true,
        data: enrollment,
        message: 'Student enrolled successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  async completeAdmissionWorkflow(req, res, next) {
    try {
      const result = await admissionOnboardingService.completeAdmissionWorkflow(
        req.validated.params.applicationId,
        req.validated.body,
        req.user.sub
      );

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Admission workflow completed successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  // Reports & Analytics
  async getDashboardStats(req, res, next) {
    try {
      const stats = await admissionReportService.getDashboardStats(
        req.validated.query.academicSessionId
      );

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getApplicationStats(req, res, next) {
    try {
      const stats = await admissionWorkflowService.getApplicationStats(
        req.validated.query.academicSessionId
      );

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getApplicationAuditTrail(req, res, next) {
    try {
      const auditTrail = await admissionReportService.getApplicationAuditTrail(
        req.validated.params.applicationId
      );

      return res.status(200).json({
        success: true,
        data: auditTrail,
      });
    } catch (error) {
      return next(error);
    }
  }

  async generateAdmissionReport(req, res, next) {
    try {
      const report = await admissionReportService.generateAdmissionReport(req.validated.query);

      return res.status(200).json({
        success: true,
        data: report,
        message: 'Admission report generated',
      });
    } catch (error) {
      return next(error);
    }
  }

  async getClassWiseStatistics(req, res, next) {
    try {
      const stats = await admissionReportService.getClassWiseStatistics(
        req.validated.query.academicSessionId
      );

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getAdmissionTrends(req, res, next) {
    try {
      const trends = await admissionReportService.getAdmissionTrends(
        req.validated.query.academicSessionId,
        req.validated.query.period || 'monthly'
      );

      return res.status(200).json({
        success: true,
        data: trends,
      });
    } catch (error) {
      return next(error);
    }
  }

  async checkApplicationCompleteness(req, res, next) {
    try {
      const completeness = await admissionWorkflowService.checkApplicationCompleteness(
        req.validated.params.applicationId
      );

      return res.status(200).json({
        success: true,
        data: completeness,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Get onboarding status
  async getOnboardingStatus(req, res, next) {
    try {
      const status = await admissionOnboardingService.getOnboardingStatus(
        req.validated.params.studentId
      );

      return res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AdminAdmissionController();