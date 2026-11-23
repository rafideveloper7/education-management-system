const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  subjectName: { type: String, required: true, trim: true, maxlength: 100 },
  subjectCode: { type: String, required: true, trim: true, uppercase: true, maxlength: 30, unique: true },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', required: true, index: true },
}, { timestamps: true });

module.exports = mongoose.models.Subject || mongoose.model('Subject', subjectSchema);