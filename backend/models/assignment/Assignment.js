const mongoose = require('mongoose');

const fileMetadataSchema = new mongoose.Schema({
  provider: { type: String, enum: ['cloudinary'], required: true },
  publicId: { type: String, required: true, maxlength: 255 },
  resourceType: { type: String, enum: ['raw', 'image', 'video'], required: true },
  format: { type: String, required: true, maxlength: 20 },
  mimeType: { type: String, required: true, maxlength: 100 },
  originalName: { type: String, required: true, maxlength: 255 },
  sizeBytes: { type: Number, required: true, min: 1 },
  uploadedAt: { type: Date, required: true, default: Date.now },
});

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 1, maxlength: 160 },
  description: { type: String, required: true, trim: true, maxlength: 10000 },
  academicSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession', required: true, index: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true, index: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  attachments: { type: [fileMetadataSchema], default: [] },
  dueAt: { type: Date, required: true, index: true },
  status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'CLOSED'], default: 'DRAFT', required: true, index: true },
  publishedAt: { type: Date, default: null },
}, { timestamps: true, strict: 'throw' });

assignmentSchema.index({ createdBy: 1, createdAt: -1, _id: -1 });
assignmentSchema.index({ academicSessionId: 1, classId: 1, sectionId: 1, subjectId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);