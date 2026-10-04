const mongoose = require('mongoose');

const studentEnrollmentSchema = new mongoose.Schema(
  {
    studentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    academicSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    rollNumber: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'ENDED', 'SUSPENDED'],
      required: true,
      default: 'ACTIVE',
      index: true,
    },
    validFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    validTo: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

studentEnrollmentSchema.index({ studentUserId: 1, academicSessionId: 1, status: 1 });
studentEnrollmentSchema.index({ classId: 1, sectionId: 1, academicSessionId: 1, status: 1 });
studentEnrollmentSchema.index({ validFrom: -1, _id: -1 });
studentEnrollmentSchema.index(
  { studentUserId: 1, academicSessionId: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' } }
);
studentEnrollmentSchema.pre('validate', function validateEnrollmentDates() {
  if (this.validTo && this.validTo < this.validFrom) {
    this.invalidate('validTo', 'validTo must be on or after validFrom');
  }
});

module.exports = mongoose.models.StudentEnrollment
  || mongoose.model('StudentEnrollment', studentEnrollmentSchema);