const mongoose = require('mongoose');

const teacherAssignmentSchema = new mongoose.Schema(
  {
    teacherUserId: {
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
    subjectId: {
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
    status: {
      type: String,
      enum: ['ACTIVE', 'ENDED', 'CANCELLED'],
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

teacherAssignmentSchema.index({ teacherUserId: 1, academicSessionId: 1, classId: 1, subjectId: 1, sectionId: 1, status: 1 });
teacherAssignmentSchema.index({ validFrom: -1, _id: -1 });
teacherAssignmentSchema.index(
  { teacherUserId: 1, academicSessionId: 1, classId: 1, subjectId: 1, sectionId: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' } }
);
teacherAssignmentSchema.pre('validate', function validateAssignmentDates() {
  if (this.validTo && this.validTo < this.validFrom) {
    this.invalidate('validTo', 'validTo must be on or after validFrom');
  }
});

module.exports = mongoose.models.TeacherAssignment
  || mongoose.model('TeacherAssignment', teacherAssignmentSchema);