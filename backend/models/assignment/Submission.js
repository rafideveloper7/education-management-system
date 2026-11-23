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
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  studentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentEnrollment', required: true },
  file: { type: fileMetadataSchema, required: true },
  submittedAt: { type: Date, required: true },
  status: { type: String, enum: ['ON_TIME', 'LATE'], required: true },
}, { timestamps: true, strict: 'throw' });

submissionSchema.index({ assignmentId:  1, studentUserId: 1 }, { unique: true });
submissionSchema.index({ assignmentId: 1, submittedAt: -1, _id: -1 });
submissionSchema.index({ studentUserId: 1, submittedAt: -1, _id: -1 });

module.exports = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);