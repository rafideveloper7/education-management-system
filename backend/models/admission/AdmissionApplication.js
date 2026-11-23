// Admission Application Model
// Section 5.2: Public admission application with applicant information

const mongoose = require('mongoose');

const admissionApplicationSchema = new mongoose.Schema(
  {
    // Application Identity
    applicationReference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 50,
      index: true,
    },
    admissionConfigurationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdmissionConfiguration',
      required: true,
      index: true,
    },
    
    // Applicant Information
    applicantUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    applicantFullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    applicantDateOfBirth: {
      type: Date,
      required: true,
      index: true,
    },
    applicantGender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      required: true,
    },
    applicantEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    applicantPhone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    applicantAddress: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    applicantNationality: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    
    // Academic Information
    appliedClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true,
    },
    previousSchoolName: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    previousClass: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    previousAcademicYear: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    
    // Parent/Guardian Information
    fatherName: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    fatherOccupation: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    fatherPhone: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    motherName: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    motherOccupation: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    motherPhone: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    guardianName: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    guardianRelation: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    guardianPhone: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    
    // Application State
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REQUIRES_MORE_INFO', 'APPROVED', 'REJECTED', 'ONBOARDED', 'ENROLLED'],
      required: true,
      default: 'DRAFT',
      index: true,
    },
    submissionDate: {
      type: Date,
      index: true,
    },
    
    // Review & Decision
    reviewNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    reviewedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    reviewedAt: {
      type: Date,
      index: true,
    },
    decision: {
      type: String,
      enum: ['APPROVED', 'REJECTED', 'PENDING'],
      default: 'PENDING',
      index: true,
    },
    decisionNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    decidedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    decidedAt: {
      type: Date,
      index: true,
    },
    
    // Onboarding & Enrollment
    onboardedStudentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    onboardedAt: {
      type: Date,
      index: true,
    },
    enrolledAcademicSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      index: true,
    },
    enrolledClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      index: true,
    },
    enrolledSectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      index: true,
    },
    enrolledAt: {
      type: Date,
      index: true,
    },
    
    // Application Metadata
    ipAddress: {
      type: String,
      trim: true,
      maxlength: 45,
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    source: {
      type: String,
      enum: ['WEBSITE', 'MOBILE', 'ADMIN_PANEL'],
      default: 'WEBSITE',
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes
admissionApplicationSchema.index({ applicantEmail: 1, status: 1 });
admissionApplicationSchema.index({ appliedClassId: 1, status: 1, createdAt: -1 });
admissionApplicationSchema.index({ applicantUserId: 1, createdAt: -1 });
admissionApplicationSchema.index({ status: 1, submissionDate: 1 });
admissionApplicationSchema.index({ admissionConfigurationId: 1, status: 1 });

// Application reference generator
admissionApplicationSchema.statics.generateReference = function() {
  const prefix = 'APP';
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${year}${month}${random}`;
};

// Status transition validation
admissionApplicationSchema.pre('save', function validateStatusTransition(next) {
  if (this.isModified('status')) {
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
    
    const currentStatus = this.get('status');
    const previousStatus = this.isNew ? null : this._previousStatus;
    
    if (previousStatus && !allowedTransitions[previousStatus]?.includes(currentStatus)) {
      return next(new Error(`Invalid status transition from ${previousStatus} to ${currentStatus}`));
    }
  }
  
  if (this.isModified('status')) {
    this._previousStatus = this.status;
  }
  
  next();
});

module.exports = mongoose.models.AdmissionApplication ||
  mongoose.model('AdmissionApplication', admissionApplicationSchema);