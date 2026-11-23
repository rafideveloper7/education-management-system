const mongoose = require('mongoose');

const classSubjectSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
  isElective: { type: Boolean, default: false, required: true },
  weeklyPeriods: { type: Number, min: 1, max: 60 },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', required: true, index: true },
}, { timestamps: true });

classSubjectSchema.index({ classId: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.models.ClassSubject
  || mongoose.model('ClassSubject', classSubjectSchema);