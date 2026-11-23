const mongoose = require('mongoose');

const academicClassSchema = new mongoose.Schema({
  className: { type: String, required: true, trim: true, maxlength: 80, unique: true },
  classCode: { type: String, trim: true, uppercase: true, maxlength: 30, sparse: true, unique: true },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', required: true, index: true },
}, { timestamps: true });

module.exports = mongoose.models.Class || mongoose.model('Class', academicClassSchema);