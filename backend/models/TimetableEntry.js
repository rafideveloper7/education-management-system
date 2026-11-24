const mongoose = require('mongoose');

const timetableEntrySchema = new mongoose.Schema({
  academicSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession', required: true, index: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true, index: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  day: { type: String, required: true, trim: true, maxlength: 40 },
  periodId: { type: String, required: true, trim: true, maxlength: 100 },
  status: {
    type: String,
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    required: true,
    default: 'DRAFT',
    index: true,
  },
  publishedAt: { type: Date, default: null },
  archivedAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true, strict: 'throw' });

const activeStatusFilter = { status: { $in: ['DRAFT', 'PUBLISHED'] } };

timetableEntrySchema.index(
  { academicSessionId: 1, day: 1, periodId: 1, teacherId: 1 },
  { unique: true, partialFilterExpression: activeStatusFilter }
);
timetableEntrySchema.index(
  { academicSessionId: 1, day: 1, periodId: 1, sectionId: 1 },
  { unique: true, partialFilterExpression: activeStatusFilter }
);
timetableEntrySchema.index({ academicSessionId: 1, classId: 1, sectionId: 1, day: 1, periodId: 1 });
timetableEntrySchema.index({ teacherId: 1, academicSessionId: 1, status: 1, day: 1, periodId: 1 });

module.exports = mongoose.models.TimetableEntry
  || mongoose.model('TimetableEntry', timetableEntrySchema);
