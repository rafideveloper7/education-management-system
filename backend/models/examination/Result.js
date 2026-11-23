const mongoose = require('mongoose');

const gradeBandSnapshotSchema = new mongoose.Schema({
  minimumPercentage: { type: Number, required: true },
  maximumPercentage: { type: Number, required: true },
  grade: { type: String, required: true },
  isPassing: { type: Boolean, required: true },
}, { _id: false, strict: 'throw' });

const subjectResultSchema = new mongoose.Schema({
  examScheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamSchedule', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  status: { type: String, enum: ['PRESENT', 'ABSENT'], required: true },
  obtainedMarks: { type: Number, required: true, min: 0 },
  maximumMarks: { type: Number, required: true, min: 1 },
  percentage: { type: Number, required: true, min: 0, max: 100 },
  grade: { type: String, required: true, maxlength: 12 },
  isPassing: { type: Boolean, required: true },
}, { _id: false, strict: 'throw' });

const resultSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  academicSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession',
    required: true,
  },
  studentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentEnrollment', required: true },
  gradeScaleId: { type: mongoose.Schema.Types.ObjectId, ref: 'GradeScale', required: true },
  gradeScaleSnapshot: { type: [gradeBandSnapshotSchema], required: true },
  subjects: { type: [subjectResultSchema], required: true },
  totalObtainedMarks: { type: Number, required: true, min: 0 },
  totalMaximumMarks: { type: Number, required: true, min: 1 },
  overallPercentage: { type: Number, required: true, min: 0, max: 100 },
  overallGrade: { type: String, default: null, maxlength: 12 },
  overallPassing: { type: Boolean, default: null },
  status: {
    type: String,
    enum: ['DRAFT', 'FINALIZED', 'PUBLISHED'],
    required: true,
    default: 'DRAFT',
    index: true,
  },
  finalizedAt: { type: Date, default: null },
  publishedAt: { type: Date, default: null },
  correctionCount: { type: Number, required: true, default: 0, min: 0 },
}, { timestamps: true, strict: 'throw' });

resultSchema.index({ examId: 1, studentUserId: 1 }, { unique: true });
resultSchema.index({ studentUserId: 1, status: 1, createdAt: -1, _id: -1 });

module.exports = mongoose.models.Result || mongoose.model('Result', resultSchema);
