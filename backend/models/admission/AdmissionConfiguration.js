// Admission Configuration Model
// Section 5.1: Institute-level admission configuration and policy

const mongoose = require('mongoose');

const admissionConfigurationSchema = new mongoose.Schema(
  {
    academicSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    admissionEnabled: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    submissionStartDate: {
      type: Date,
      required: true,
      index: true,
    },
    submissionEndDate: {
      type: Date,
      required: true,
      index: true,
    },
    applicableClasses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      index: true,
    }],
    eligibilityCriteria: {
      minimumAge: {
        type: Number,
        min: 0,
        max: 100,
      },
      maximumAge: {
        type: Number,
        min: 0,
        max: 100,
      },
      previousAcademicRequired: {
        type: Boolean,
        default: false,
      },
      entranceTestRequired: {
        type: Boolean,
        default: false,
      },
      interviewRequired: {
        type: Boolean,
        default: false,
      },
    },
    requiredFields: [{
      fieldName: {
        type: String,
        required: true,
        trim: true,
      },
      fieldType: {
        type: String,
        enum: ['TEXT', 'NUMBER', 'DATE', 'SELECT', 'BOOLEAN'],
        required: true,
      },
      required: {
        type: Boolean,
        default: false,
      },
      options: [String],
      validationRules: {
        type: String,
        trim: true,
      },
    }],
    requiredDocuments: [{
      documentType: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },
      description: {
        type: String,
        trim: true,
        maxlength: 500,
      },
      required: {
        type: Boolean,
        default: true,
      },
      allowedFileTypes: [String],
      maxFileSize: {
        type: Number,
        min: 0,
      },
    }],
    feeConfiguration: {
      applicationFee: {
        type: Number,
        min: 0,
        default: 0,
      },
      admissionFee: {
        type: Number,
        min: 0,
        default: 0,
      },
      feePaymentRequired: {
        type: Boolean,
        default: false,
      },
      paymentStage: {
        type: String,
        enum: ['APPLICATION', 'APPROVAL', 'ENROLLMENT'],
        default: 'ENROLLMENT',
      },
    },
    approvalWorkflow: {
      requiresReview: {
        type: Boolean,
        default: true,
      },
      autoApprove: {
        type: Boolean,
        default: false,
      },
      approvalRequiredBy: {
        type: String,
        enum: ['SINGLE_ADMIN', 'MULTIPLE_ADMINS', 'COMMITTEE'],
        default: 'SINGLE_ADMIN',
      },
    },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    updatedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'DRAFT', 'ARCHIVED'],
      required: true,
      default: 'ACTIVE',
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes
admissionConfigurationSchema.index({ academicSessionId: 1, status: 1 });
admissionConfigurationSchema.index({ submissionStartDate: 1, submissionEndDate: 1, status: 1 });
admissionConfigurationSchema.index({ createdByUserId: 1, updatedAt: -1 });

// Validation
admissionConfigurationSchema.pre('validate', function validateConfiguration() {
  if (this.submissionEndDate && this.submissionStartDate && this.submissionEndDate < this.submissionStartDate) {
    this.invalidate('submissionEndDate', 'submissionEndDate must be after submissionStartDate');
  }

  if (this.eligibilityCriteria.minimumAge && this.eligibilityCriteria.maximumAge) {
    if (this.eligibilityCriteria.minimumAge > this.eligibilityCriteria.maximumAge) {
      this.invalidate('eligibilityCriteria.maximumAge', 'maximumAge must be greater than or equal to minimumAge');
    }
  }
});

module.exports = mongoose.models.AdmissionConfiguration ||
  mongoose.model('AdmissionConfiguration', admissionConfigurationSchema);