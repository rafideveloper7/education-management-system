const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, required: true, trim: true, maxlength: 20000 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  audience: [{
    type: String,
    enum: ['ALL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
  }],
  status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], required: true, default: 'DRAFT', index: true },
  publishedAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
  archivedAt: { type: Date, default: null },
}, { timestamps: true, strict: 'throw' });

announcementSchema.index({ status: 1, publishedAt: -1 });
announcementSchema.index({ audience: 1, status: 1, publishedAt: -1 });

module.exports = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);
