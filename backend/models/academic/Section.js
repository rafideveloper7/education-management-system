const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
  sectionName: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
  roomNumber: { type: String, trim: true, maxlength: 40 },
  capacity: { type: Number, min: 1, max: 500 },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', required: true, index: true },
}, { timestamps: true });

sectionSchema.index({ classId: 1, sectionName: 1 }, { unique: true });

module.exports = mongoose.models.Section || mongoose.model('Section', sectionSchema);