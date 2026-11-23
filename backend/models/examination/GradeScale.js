const mongoose = require('mongoose');

const gradeBandSchema = new mongoose.Schema({
  minimumPercentage: { type: Number, required: true, min: 0, max: 100 },
  maximumPercentage: { type: Number, required: true, min: 0, max: 100 },
  grade: { type: String, required: true, trim: true, minlength: 1, maxlength: 12 },
  isPassing: { type: Boolean, required: true },
}, { _id: false, strict: 'throw' });

const gradeScaleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
  academicSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession',
    required: true,
    unique: true,
  },
  calculateOverallGrade: { type: Boolean, required: true, default: false },
  gradeBands: {
    type: [gradeBandSchema],
    required: true,
    validate: { validator: (bands) => Array.isArray(bands) && bands.length > 0 },
  },
  workflowRevision: { type: Number, required: true, default: 0, min: 0, select: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, strict: 'throw' });

gradeScaleSchema.pre('validate', function validateGradeBands() {
  const bands = [...(this.gradeBands || [])].sort((left, right) => (
    left.minimumPercentage - right.minimumPercentage
  ));
  if (bands.length === 0 || bands[0].minimumPercentage !== 0
    || bands[bands.length - 1].maximumPercentage !== 100) {
    this.invalidate('gradeBands', 'Grade bands must cover the full 0 to 100 percentage range');
    return;
  }

  for (let index = 0; index < bands.length; index += 1) {
    const band = bands[index];
    if (band.minimumPercentage >= band.maximumPercentage) {
      this.invalidate('gradeBands', 'Each grade band must have a positive range');
      return;
    }
    if (index > 0 && bands[index - 1].maximumPercentage !== band.minimumPercentage) {
      this.invalidate('gradeBands', 'Grade bands must not overlap or leave gaps');
      return;
    }
  }

  const labels = bands.map(({ grade }) => grade.toLocaleLowerCase());
  if (new Set(labels).size !== labels.length) {
    this.invalidate('gradeBands', 'Grade labels must be unique');
  }
});

module.exports = mongoose.models.GradeScale
  || mongoose.model('GradeScale', gradeScaleSchema);
