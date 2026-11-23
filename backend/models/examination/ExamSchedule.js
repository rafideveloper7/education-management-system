const mongoose = require('mongoose');

const examScheduleSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
  academicSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession',
    required: true,
  },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacherUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  room: { type: String, trim: true, uppercase: true, maxlength: 40, default: null },
  maximumMarks: { type: Number, required: true, min: 1 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, strict: 'throw' });

examScheduleSchema.index({ examId: 1, classId: 1, sectionId: 1, subjectId: 1 }, { unique: true });
examScheduleSchema.index({ sectionId: 1, startAt: 1, endAt: 1 });
examScheduleSchema.index({ teacherUserId: 1, startAt: 1, endAt: 1 });
examScheduleSchema.index({ room: 1, startAt: 1, endAt: 1 });

examScheduleSchema.pre('validate', function validateSchedule() {
  if (this.startAt && this.endAt && this.startAt >= this.endAt) {
    this.invalidate('endAt', 'endAt must be after startAt');
  }
  if (Number.isFinite(this.maximumMarks) && !Number.isInteger(this.maximumMarks)) {
    this.invalidate('maximumMarks', 'maximumMarks must be a whole number');
  }
});

module.exports = mongoose.models.ExamSchedule
  || mongoose.model('ExamSchedule', examScheduleSchema);
