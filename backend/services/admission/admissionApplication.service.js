// Admission Application Service
// Section 5.2: Public admission application management

const AdmissionApplication = require('../../models/admission/AdmissionApplication');
const AdmissionConfiguration = require('../../models/admission/AdmissionConfiguration');
const { ApiError } = require('../../utils/ApiError');
const User = require('../../models/user/User');
const StudentProfile = require('../../models/profile/StudentProfile');

class AdmissionApplicationService {
  // Create new application (draft)
  async createDraftApplication(data, applicantUserId = null) {
    const configuration = await AdmissionConfiguration.findById(data.admissionConfigurationId);
    if (!configuration) {
      throw new ApiError(404, 'Admission configuration not found');
    }

    if (configuration.status !== 'ACTIVE') {
      throw new ApiError(400, 'Admission configuration is not active');
    }

    // Generate application reference
    const applicationReference = AdmissionApplication.generateReference();

    const application = new AdmissionApplication({
      ...data,
      applicationReference,
      applicantUserId,
      status: 'DRAFT',
    });

    await application.save();
    return application;
  }

  // Submit application
  async submitApplication(applicationId, applicantUserId, ipAddress = null, userAgent = null) {
    const application = await AdmissionApplication.findById(applicationId);
    if (!application) {
      throw new ApiError(404, 'Admission application not found');
    }

    // Verify ownership for authenticated users
    if (applicantUserId && application.applicantUserId) {
      if (application.applicantUserId.toString() !== applicantUserId.toString()) {
        throw new ApiError(403, 'You do not have permission to submit this application');
      }
    }

    if (application.status !== 'DRAFT') {
      throw new ApiError(400, 'Only draft applications can be submitted');
    }

    // Validate eligibility
    const configuration = await AdmissionConfiguration.findById(application.admissionConfigurationId);
    const now = new Date();

    if (now < configuration.submissionStartDate) {
      throw new ApiError(400, 'Admission submissions have not started yet');
    }
    if (now > configuration.submissionEndDate) {
      throw new ApiError(400, 'Admission submissions have ended');
    }

    // Update application
    application.status = 'SUBMITTED';
    application.submissionDate = now;
    application.ipAddress = ipAddress;
    application.userAgent = userAgent;

    if (applicantUserId && !application.applicantUserId) {
      application.applicantUserId = applicantUserId;
    }

    await application.save();
    return application;
  }

  // Get application by ID with authorization
  async getApplicationById(applicationId, userId, userRole) {
    const application = await AdmissionApplication.findById(applicationId)
      .populate('admissionConfigurationId', 'name academicSessionId')
      .populate('appliedClassId', 'name gradeLevel')
      .populate('applicantUserId', 'fullName email role');

    if (!application) {
      throw new ApiError(404, 'Admission application not found');
    }

    // Authorization checks
    if (userRole === 'ADMIN') {
      return application; // Admin can view all
    }

    if (userRole === 'PUBLIC_USER' || userRole === 'STUDENT' || userRole === 'PARENT') {
      if (application.applicantUserId && application.applicantUserId._id.toString() !== userId.toString()) {
        throw new ApiError(403, 'You do not have permission to view this application');
      }
    }

    return application;
  }

  // List applications with filters (admin only)
  async listApplications(filters = {}) {
    const query = {};

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.academicSessionId) {
      query['admissionConfigurationId.academicSessionId'] = filters.academicSessionId;
    }
    if (filters.classId) {
      query.appliedClassId = filters.classId;
    }
    if (filters.search) {
      query.$or = [
        { applicationReference: { $regex: filters.search, $options: 'i' } },
        { applicantFullName: { $regex: filters.search, $options: 'i' } },
        { applicantEmail: { $regex: filters.search, $options: 'i' } },
      ];
    }
    if (filters.startDate || filters.endDate) {
      query.submissionDate = {};
      if (filters.startDate) query.submissionDate.$gte = new Date(filters.startDate);
      if (filters.endDate) query.submissionDate.$lte = new Date(filters.endDate);
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      AdmissionApplication.find(query)
        .populate('admissionConfigurationId', 'name academicSessionId')
        .populate('appliedClassId', 'name gradeLevel')
        .populate('applicantUserId', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AdmissionApplication.countDocuments(query),
    ]);

    return {
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Update application (draft only)
  async updateDraftApplication(applicationId, updates, applicantUserId) {
    const application = await AdmissionApplication.findById(applicationId);
    if (!application) {
      throw new ApiError(404, 'Admission application not found');
    }

    if (application.status !== 'DRAFT') {
      throw new ApiError(400, 'Only draft applications can be updated');
    }

    if (application.applicantUserId && application.applicantUserId.toString() !== applicantUserId.toString()) {
      throw new ApiError(403, 'You do not have permission to update this application');
    }

    Object.assign(application, updates);
    await application.save();
    return application;
  }

  // Check for duplicate applications
  async checkDuplicateApplication(email, phone, dateOfBirth, classId) {
    const duplicate = await AdmissionApplication.findOne({
      applicantEmail: email.toLowerCase(),
      applicantPhone: phone,
      applicantDateOfBirth: dateOfBirth,
      appliedClassId: classId,
      status: { $in: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED'] },
    });

    return {
      isDuplicate: !!duplicate,
      duplicateApplication: duplicate,
    };
  }
}

module.exports = new AdmissionApplicationService();