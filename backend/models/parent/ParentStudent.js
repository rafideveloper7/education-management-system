const mongoose = require('mongoose');

const parentStudentSchema = new mongoose.Schema(
  {
    parentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    relationshipType: {
      type: String,
      enum: ['FATHER', 'MOTHER', 'GUARDIAN', 'UNCLE', 'AUNT', 'GRANDPARENT', 'OTHER'],
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ENDED', 'DECEASED'],
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
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

parentStudentSchema.index({ parentUserId: 1, studentUserId: 1, status: 1, validFrom: 1, validTo: 1 });
parentStudentSchema.index({ validFrom: -1, _id: -1 });
parentStudentSchema.index(
  { parentUserId: 1, studentUserId: 1, relationshipType: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' } }
);
parentStudentSchema.pre('validate', function validateRelationshipDates() {
  if (this.parentUserId && this.studentUserId && this.parentUserId.equals(this.studentUserId)) {
    this.invalidate('studentUserId', 'A user cannot be their own parent or guardian');
  }

  if (this.validTo && this.validTo < this.validFrom) {
    this.invalidate('validTo', 'validTo must be on or after validFrom');
  }
});

module.exports = mongoose.models.ParentStudent
  || mongoose.model('ParentStudent', parentStudentSchema);