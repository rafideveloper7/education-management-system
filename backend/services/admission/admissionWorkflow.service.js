// Admission Workflow Service
// Section 5.5-5.6: Application review, approval/rejection workflow

const AdmissionApplication = require('../../models/admission/AdmissionApplication');
const AdmissionHistory = require('../../models/admission/AdmissionHistory');
const User = require('../../models/user/User');
const StudentProfile = require('../../models/profile/StudentProfile');
const { ApiError } = require('../../utils/ApiError');
const { PERMISSIONS } = require('../../authorization/constants/permissions.constants');
const notificationService = require('../notification/notification.service');

class AdmissionWorkflowService {
  // Start review process
  async startReview(applicationId, reviewerUserId, reviewNotes = '') {
    const application = await AdmissionApplication.findById(applicationId);
    if (!application) {
      throw new ApiError(404, 'Admission application not found');
    }

    if (application.status !== 'SUBMITTED') {
      throw new ApiError(400, 'Application must be in SUBMITTED status to start review');
    }

    // Update application
    application.status = 'UNDER_REVIEW';
    application.reviewedByUserId = reviewerUserId;
    application.reviewedAt = new Date();
    application.reviewNotes = reviewNotes;

    await application.save();

    // Record history
    await AdmissionHistory.recordAction({
      admissionApplicationId: applicationId,
      actionType: 'REVIEW_STARTED',
      actionDescription: 'Application review started',
      actorUserId: reviewerUserId,
      actorRole: 'ADMIN',
      previousState: { status: 'SUBMITTED' },
      newState: { status: 'UNDER_REVIEW' },
    });

    return application;
  }

  // Request more information
  async requestMoreInfo(applicationId, adminUserId, requestNotes) {
    const application = await AdmissionApplication.findById(applicationId);
    if (!application) {
      throw new ApiError(404, 'Admission application not found');
    }

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(application.status)) {
      throw new ApiError(400, 'Application must be in SUBMITTED or UNDER_REVIEW status');
    }

    // Update application
    application.status = 'REQUIRES_MORE_INFO';
    application.reviewedByUserId = adminUserId;
    application.reviewedAt = new Date();
    application.reviewNotes = requestNotes;

    await application.save();

    // Record history
    await AdmissionHistory.recordAction({
      admissionApplicationId: applicationId,
      actionType: 'MORE_INFO_REQUESTED',
      actionDescription: 'More information requested from applicant',
      actorUserId: adminUserId,
      actorRole: 'ADMIN',
      previousState: { status: application.status },
      newState: { status: 'REQUIRES_MORE_INFO' },
    });

    return application;
  }

  // Approve application
  async approveApplication(applicationId, approverUserId, approvalNotes = '') {
    const application = await AdmissionApplication.findById(applicationId);
    if (!application) {
      throw new ApiError(404, 'Admission application not found');
    }

    if (application.status !== 'UNDER_REVIEW') {
      throw new ApiError(400, 'Application must be in UNDER_REVIEW status to approve');
    }

    // Prevent duplicate approval
    if (application.decision === 'APPROVED') {
      throw new ApiError(400, 'Application has already been approved');
    }

    // Update application
    application.status = 'APPROVED';
    application.decision = 'APPROVED';
    application.decisionNotes = approvalNotes;
    application.decidedByUserId = approverUserId;
    application.decidedAt = new Date();

    await application.save();

    // Record history
    await AdmissionHistory.recordAction({
      admissionApplicationId: applicationId,
      actionType: 'DECISION_APPROVED',
      actionDescription: 'Application approved for admission',
      actorUserId: approverUserId,
      actorRole: 'ADMIN',
      previousState: { status: 'UNDER_REVIEW', decision: 'PENDING' },
      newState: { status: 'APPROVED', decision: 'APPROVED' },
    });

    await notificationService.publishSafe({
      eventId: `admission-approved:${application._id}`,
      type: 'ADMISSION_APPROVED',
      title: 'Admission Approved',
      message: 'Your admission application has been approved.',
      recipientIds: application.applicantUserId ? [application.applicantUserId] : [],
      referenceId: application._id,
      referenceType: 'ADMISSION_APPLICATION',
      actorId: approverUserId,
    });

    return application;
  }

  // Reject application
  async rejectApplication(applicationId, rejecterUserId, rejectionNotes) {
    const application = await AdmissionApplication.findById(applicationId);
    if (!application) {
      throw new ApiError(404, 'Admission application not found');
    }

    if (application.status !== 'UNDER_REVIEW') {
      throw new ApiError(400, 'Application must be in UNDER_REVIEW status to reject');
    }

    if (application.decision === 'REJECTED') {
      throw new ApiError(400, 'Application has already been rejected');
    }

    // Update application
    application.status = 'REJECTED';
    application.decision = 'REJECTED';
    application.decisionNotes = rejectionNotes;
    application.decidedByUserId = rejecterUserId;
    application.decidedAt = new Date();

    await application.save();

    // Record history
    await AdmissionHistory.recordAction({
      admissionApplicationId: applicationId,
      actionType: 'DECISION_REJECTED',
      actionDescription: 'Application rejected',
      actorUserId: rejecterUserId,
      actorRole: 'ADMIN',
      previousState: { status: 'UNDER_REVIEW', decision: 'PENDING' },
      newState: { status: 'REJECTED', decision: 'REJECTED' },
    });

    await notificationService.publishSafe({
      eventId: `admission-rejected:${application._id}`,
      type: 'ADMISSION_REJECTED',
      title: 'Admission Rejected',
      message: 'Your admission application has been rejected.',
      recipientIds: application.applicantUserId ? [application.applicantUserId] : [],
      referenceId: application._id,
      referenceType: 'ADMISSION_APPLICATION',
      actorId: rejecterUserId,
    });

    return application;
  }

  // Complete review without decision
  async completeReview(applicationId, reviewerUserId, reviewNotes) {
    const application = await AdmissionApplication.findById(applicationId);
    if (!application) {
      throw new ApiError(404, 'Admission application not found');
    }

    if (application.status !== 'UNDER_REVIEW') {
      throw new ApiError(400, 'Application must be in UNDER_REVIEW status');
    }

    // Update review info
    application.reviewedByUserId = reviewerUserId;
    application.reviewedAt = new Date();
    application.reviewNotes = reviewNotes;

    await application.save();

    // Record history
    await AdmissionHistory.recordAction({
      admissionApplicationId: applicationId,
      actionType: 'REVIEW_COMPLETED',
      actionDescription: 'Application review completed',
      actorUserId: reviewerUserId,
      actorRole: 'ADMIN',
      previousState: { reviewedByUserId: null, reviewedAt: null },
      newState: { reviewedByUserId: reviewerUserId, reviewedAt: new Date() },
    });

    return application;
  }

  // Get application statistics
  async getApplicationStats(academicSessionId = null) {
    const matchStage = {};
    if (academicSessionId) {
      // Note: This requires proper population or denormalization
      // For now, we'll filter by configuration's academic session
      matchStage['admissionConfigurationId.academicSessionId'] = academicSessionId;
    }

    const stats = await AdmissionApplication.aggregate([
      {
        $lookup: {
          from: 'admissionconfigurations',
          localField: 'admissionConfigurationId',
          foreignField: '_id',
          as: 'configuration',
        },
      },
      {
        $unwind: {
          path: '$configuration',
          preserveNullAndEmptyArrays: true,
        },
      },
      ...(academicSessionId ? [
        {
          $match: {
            'configuration.academicSessionId': academicSessionId,
          },
        },
      ] : []),
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Format stats
    const formattedStats = {
      total: 0,
      byStatus: {},
    };

    stats.forEach(stat => {
      formattedStats.total += stat.count;
      formattedStats.byStatus[stat.status] = stat.count;
    });

    // Add decision stats
    const decisionStats = await AdmissionApplication.aggregate([
      ...(academicSessionId ? [
        {
          $lookup: {
            from: 'admissionconfigurations',
            localField: 'admissionConfigurationId',
            foreignField: '_id',
            as: 'configuration',
          },
        },
        {
          $unwind: {
            path: '$configuration',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            'configuration.academicSessionId': academicSessionId,
          },
        },
      ] : []),
      {
        $group: {
          _id: '$decision',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          decision: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    formattedStats.byDecision = {};
    decisionStats.forEach(stat => {
      formattedStats.byDecision[stat.decision] = stat.count;
    });

    return formattedStats;
  }

  // Check application completeness for review
  async checkApplicationCompleteness(applicationId) {
    const application = await AdmissionApplication.findById(applicationId)
      .populate('admissionConfigurationId');

    if (!application) {
      throw new ApiError(404, 'Admission application not found');
    }

    const missingFields = [];
    const configuration = application.admissionConfigurationId;

    // Check required fields
    if (configuration.requiredFields) {
      configuration.requiredFields.forEach(field => {
        if (field.required && !application[field.fieldName]) {
          missingFields.push(field.fieldName);
        }
      });
    }

    // Check required documents (simplified check)
    // In real implementation, would check AdmissionDocument collection

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      totalFields: configuration.requiredFields?.length || 0,
      completedFields: (configuration.requiredFields?.length || 0) - missingFields.length,
    };
  }
}

module.exports = new AdmissionWorkflowService();