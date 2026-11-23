const mongoose = require('mongoose');
const { isDateKey } = require('../../utils/attendanceDate');

const attendanceSchema = new mongoose.Schema({
  studentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentEnrollment', required: true },
  academicSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  attendanceDate: { type: String, required: true, validate: { validator: isDateKey, message: 'attendanceDate must be a valid YYYY-MM-DD date' } },
  status: { type: String, enum: ['PRESENT', 'ABSENT'], required: true },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  correctedAt: { type: Date, default: null },
  lastCorrectionReason: { type: String, trim: true, maxlength: 500, default: null },
}, { timestamps: true });

attendanceSchema.index({ enrollmentId: 1, attendanceDate: 1 }, { unique: true });
attendanceSchema.index({ academicSessionId: 1, classId: 1, sectionId: 1, attendanceDate: 1, _id: 1 });
attendanceSchema.index({ studentUserId: 1, academicSessionId: 1, attendanceDate: -1, _id: -1 });

module.exports = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);