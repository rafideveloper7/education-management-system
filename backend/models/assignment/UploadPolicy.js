const mongoose = require('mongoose');

const uploadPolicySchema = new mongoose.Schema({
  _id: { type: String, default: 'default' },
  attachmentMaxBytes: { type: Number, required: true, min: 1, max: 50 * 1024 * 1024, default: 10 * 1024 * 1024 },
  submissionMaxBytes: { type: Number, required: true, min: 1, max: 50 * 1024 * 1024, default: 20 * 1024 * 1024 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true, strict: 'throw' });

module.exports = mongoose.models.UploadPolicy || mongoose.model('UploadPolicy', uploadPolicySchema);