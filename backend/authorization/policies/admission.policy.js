// Admission Policy
// Section 5.8: Fine-grained authorization policies for admission module

const { ApiError } = require('../../utils/ApiError');
const AdmissionApplication = require('../../models/admission/AdmissionApplication');
const AdmissionDocument = require('../../models/admission/AdmissionDocument');

class AdmissionPolicy {
  // Check if user can view application
  async canViewApplication(user, applicationId) {
    const application = await AdmissionApplication.findById(applicationId);
    if (!application) {
      throw new ApiError(404, 'Application not found');
    }

    // Admin can view all applications
    if (user.role === 'ADMIN') {
      return true;
    }

    // Applicant can view their own application
    if (application.applicantUserId && application.applicantUserId.toString() === user.sub) {
      return true;
    }

    // Public user can view their own application (by reference or email)
    if (user.role === 'PUBLIC_USER') {
      // Check if application belongs to this user via email
      if (application.applicantEmail.toLowerCase() === user.email.toLowerCase()) {
        return true;
      }
    }

    return false;
  }

  // Check if user can update application
  async canUpdateApplication(user, applicationId) {
    const application = await AdmissionApplication.findById(applicationId);
    if (!application) {
      throw new ApiError(404, 'Application not found');
    }

    // Only draft applications can be updated
    if (application.status !== 'DRAFT') {
      throw new ApiError(400, 'Only draft applications can be updated');
    }

    // Admin can update any application
    if (user.role === 'ADMIN') {
      return true;
    }

    // Applicant can update their own draft application
    if (application.applicantUserId && application.applicantUserId.toString() === user.sub) {
      return true;
    }

    // Public user can update their own draft application
    if (user.role === 'PUBLIC_USER' && !application.applicantUserId) {
      // Check if application email matches user email
      if (application.applicantEmail.toLowerCase() === user.email.toLowerCase()) {
        return true;
      }
    }

    return false;
  }

  // Check if user can submit application
  async canSubmitApplication(user, applicationId) {
    const application = await AdmissionApplication.findById(applicationId);
    if (!application) {
      throw new ApiError(404, 'Application not found');
    }

    // Only draft applications can be submitted
    if (application.status !== 'DRAFT') {
      throw new ApiError(400, 'Only draft applications can be submitted');
    }

    // Admin can submit any application
    if (user.role === 'ADMIN') {
      return true;
    }

    // Applicant can submit their own application
    if (application.applicantUserId && application.applicantUserId.toString() === user.sub) {
      return true;
    }

    // Public user can submit their own application
    if (user.role === 'PUBLIC_USER' && !application.applicantUserId) {
      // Check if application email matches user email
      if (application.applicantEmail.toLowerCase() === user.email.toLowerCase()) {
        return true;
      }
    }

    return false;
  }

  // Check if user can view document
  async canViewDocument(user, documentId) {
    const document = await AdmissionDocument.findById(documentId)
      .populate('admissionApplicationId', 'applicantUserId status');

    if (!document) {
      throw new ApiError(404, 'Document not found');
    }

    const application = document.admissionApplicationId;

    // Admin can view all documents
    if (user.role === 'ADMIN') {
      return true;
    }

    // Check document status
    if (document.status === 'REJECTED' || document.status === 'EXPIRED') {
      throw new ApiError(403, 'Document is not available');
    }

    // Applicant can view their own documents
    if (application.applicantUserId && application.applicantUserId.toString() === user.sub) {
      return true;
    }

    // Public user can view their own documents
    if (user.role === 'PUBLIC_USER' && !application.applicantUserId) {
      // Would need to verify ownership via application reference or email
      // For now, return false for security
      return false;
    }

    return false;
  }

  // Check if user can upload document
  async canUploadDocument(user, applicationId) {
    const application = await AdmissionApplication.findById(applicationId);
    if (!application) {
      throw new ApiError(404, 'Application not found');
    }

    // Only certain statuses allow document upload
    const allowedStatuses = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REQUIRES_MORE_INFO'];
    if (!allowedStatuses.includes(application.status)) {
      throw new ApiError(400, 'Documents cannot be uploaded for applications in current status');
    }

    // Admin can upload documents for any application
    if (user.role === 'ADMIN') {
      return true;
    }

    // Applicant can upload documents for their own application
    if (application.applicantUserId && application.applicantUserId.toString() === user.sub) {
      return true;
    }

    // Public user can upload documents for their own application
    if (user.role === 'PUBLIC_USER' && !application.applicantUserId) {
      // Check if application email matches user email
      if (application.applicantEmail.toLowerCase() === user.email.toLowerCase()) {
        return true;
      }
    }

    return false;
  }

  // Check if user can delete document
  async canDeleteDocument(user, documentId) {
    const document = await AdmissionDocument.findById(documentId)
      .populate('admissionApplicationId', 'applicantUserId status');

    if (!document) {
      throw new ApiError(404, 'Document not found');
    }

    const application = document.admissionApplicationId;

    // Admin can delete any document
    if (user.role === 'ADMIN') {
      return true;
    }

    // Only certain statuses allow document deletion
    const allowedStatuses = ['UPLOADED', 'REJECTED'];
    if (!allowedStatuses.includes(document.status)) {
      throw new ApiError(400, 'Document cannot be deleted in current status');
    }

    // Applicant can delete their own documents
    if (application.applicantUserId && application.applicantUserId.toString() === user.sub) {
      return true;
    }

    // Check if user uploaded the document
    if (document.uploadedByUserId && document.uploadedByUserId.toString() === user.sub) {
      return true;
    }

    return false;
  }

  // Check if user can review application
  async canReviewApplication(user, applicationId) {
    const application = await AdmissionApplication.findById(applicationId);
    if (!application) {
      throw new ApiError(404, 'Application not found');
    }

    // Only admin can review applications
    if (user.role !== 'ADMIN') {
      return false;
    }

    // Only submitted or under review applications can be reviewed
    const allowedStatuses = ['SUBMITTED', 'UNDER_REVIEW'];
    if (!allowedStatuses.includes(application.status)) {
      throw new ApiError(400, 'Application cannot be reviewed in current status');
    }

    return true;
  }

  // Check if user can approve/reject application
  async canDecideApplication(user, applicationId) {
    const application = await AdmissionApplication.findById(applicationId);
    if (!application) {
      throw new ApiError(404, 'Application not found');
    }

    // Only admin can approve/reject applications
    if (user.role !== 'ADMIN') {
      return false;
    }

    // Only applications under review can be decided
    if (application.status !== 'UNDER_REVIEW') {
      throw new ApiError(400, 'Application must be under review to approve/reject');
    }

    // Prevent duplicate decisions
    if (application.decision !== 'PENDING') {
      throw new ApiError(400, 'Application has already been decided');
    }

    return true;
  }

  // Check if user can onboard student
  async canOnboardStudent(user, applicationId) {
    const application = await AdmissionApplication.findById(applicationId);
    if (!application) {
      throw new ApiError(404, 'Application not found');
    }

    // Only admin can onboard students
    if (user.role !== 'ADMIN') {
      return false;
    }

    // Only approved applications can be onboarded
    if (application.status !== 'APPROVED') {
      throw new ApiError(400, 'Only approved applications can be onboarded');
    }

    // Prevent duplicate onboarding
    if (application.onboardedStudentUserId) {
      throw new ApiError(400, 'Student has already been onboarded');
    }

    return true;
  }

  // Check if user can view admission reports
  async canViewReports(user) {
    // Only admin can view admission reports
    return user.role === 'ADMIN';
  }

  // Check if user can manage admission configuration
  async canManageConfiguration(user) {
    // Only admin can manage admission configuration
    return user.role === 'ADMIN';
  }

  // Check application ownership
  async isApplicationOwner(user, applicationId) {
    const application = await AdmissionApplication.findById(applicationId);
    if (!application) {
      return false;
    }

    if (application.applicantUserId && application.applicantUserId.toString() === user.sub) {
      return true;
    }

    if (user.role === 'PUBLIC_USER' && !application.applicantUserId) {
      return application.applicantEmail.toLowerCase() === user.email.toLowerCase();
    }

    return false;
  }

  // Validate status transition
  validateStatusTransition(currentStatus, newStatus) {
    const allowedTransitions = {
      DRAFT: ['SUBMITTED'],
      SUBMITTED: ['UNDER_REVIEW', 'REQUIRES_MORE_INFO'],
      UNDER_REVIEW: ['REQUIRES_MORE_INFO', 'APPROVED', 'REJECTED'],
      REQUIRES_MORE_INFO: ['SUBMITTED', 'UNDER_REVIEW'],
      APPROVED: ['ONBOARDED'],
      REJECTED: [],
      ONBOARDED: ['ENROLLED'],
      ENROLLED: [],
    };

    if (!allowedTransitions[currentStatus]) {
      return false;
    }

    return allowedTransitions[currentStatus].includes(newStatus);
  }
}

module.exports = new AdmissionPolicy();