// Admission Configuration Service
// Section 5.1: Institute-level admission configuration management

const AdmissionConfiguration = require('../../models/admission/AdmissionConfiguration');
const { ApiError } = require('../../utils/ApiError');
const { PERMISSIONS } = require('../../authorization/constants/permissions.constants');

class AdmissionConfigurationService {
  // Create new admission configuration
  async createConfiguration(data, actorUserId) {
    const configuration = new AdmissionConfiguration({
      ...data,
      createdByUserId: actorUserId,
      updatedByUserId: actorUserId,
    });

    await configuration.save();
    return configuration;
  }

  // Update existing configuration
  async updateConfiguration(configurationId, updates, actorUserId) {
    const configuration = await AdmissionConfiguration.findById(configurationId);
    if (!configuration) {
      throw new ApiError(404, 'Admission configuration not found');
    }

    // Update fields
    Object.assign(configuration, updates);
    configuration.updatedByUserId = actorUserId;
    
    await configuration.save();
    return configuration;
  }

  // Get active configurations
  async getActiveConfigurations(filters = {}) {
    const query = { status: 'ACTIVE' };
    
    if (filters.academicSessionId) {
      query.academicSessionId = filters.academicSessionId;
    }
    
    if (filters.admissionEnabled !== undefined) {
      query.admissionEnabled = filters.admissionEnabled;
    }
    
    const now = new Date();
    if (filters.currentlyOpen) {
      query.submissionStartDate = { $lte: now };
      query.submissionEndDate = { $gte: now };
    }

    return await AdmissionConfiguration.find(query)
      .populate('academicSessionId', 'name startDate endDate')
      .populate('applicableClasses', 'name gradeLevel')
      .sort({ createdAt: -1 });
  }

  // Get configuration by ID
  async getConfigurationById(configurationId) {
    const configuration = await AdmissionConfiguration.findById(configurationId)
      .populate('academicSessionId', 'name startDate endDate')
      .populate('applicableClasses', 'name gradeLevel')
      .populate('createdByUserId', 'fullName email')
      .populate('updatedByUserId', 'fullName email');

    if (!configuration) {
      throw new ApiError(404, 'Admission configuration not found');
    }

    return configuration;
  }

  // Archive configuration
  async archiveConfiguration(configurationId, actorUserId) {
    const configuration = await AdmissionConfiguration.findById(configurationId);
    if (!configuration) {
      throw new ApiError(404, 'Admission configuration not found');
    }

    configuration.status = 'ARCHIVED';
    configuration.updatedByUserId = actorUserId;
    
    await configuration.save();
    return configuration;
  }

  // Validate admission eligibility
  async validateEligibility(configurationId, applicantData) {
    const configuration = await this.getConfigurationById(configurationId);
    
    const errors = [];
    const now = new Date();

    // Check admission window
    if (now < configuration.submissionStartDate) {
      errors.push('Admission submissions have not started yet');
    }
    if (now > configuration.submissionEndDate) {
      errors.push('Admission submissions have ended');
    }

    // Check age eligibility
    if (configuration.eligibilityCriteria.minimumAge || configuration.eligibilityCriteria.maximumAge) {
      const birthDate = new Date(applicantData.dateOfBirth);
      const age = now.getFullYear() - birthDate.getFullYear();
      
      if (configuration.eligibilityCriteria.minimumAge && age < configuration.eligibilityCriteria.minimumAge) {
        errors.push(`Applicant must be at least ${configuration.eligibilityCriteria.minimumAge} years old`);
      }
      if (configuration.eligibilityCriteria.maximumAge && age > configuration.eligibilityCriteria.maximumAge) {
        errors.push(`Applicant must be at most ${configuration.eligibilityCriteria.maximumAge} years old`);
      }
    }

    // Check class eligibility
    if (configuration.applicableClasses.length > 0) {
      const isClassApplicable = configuration.applicableClasses.some(
        classId => classId.toString() === applicantData.appliedClassId.toString()
      );
      if (!isClassApplicable) {
        errors.push('Selected class is not available for admission');
      }
    }

    return {
      eligible: errors.length === 0,
      errors,
      configuration,
    };
  }
}

module.exports = new AdmissionConfigurationService();