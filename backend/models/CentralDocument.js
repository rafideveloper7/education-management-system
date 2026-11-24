const mongoose = require('mongoose');

const storageRefSchema = new mongoose.Schema({
  provider: { type: String, enum: ['cloudinary'], required: true },
  publicId: { type: String, required: true, maxlength: 255 },
  resourceType: { type: String, enum: ['raw', 'image', 'video'], required: true },
  format: { type: String, required: true, maxlength: 20 },
}, { _id: false });

const centralDocumentSchema = new mongoose.Schema({
  ownerType: {
    type: String,
    enum: ['STUDENT', 'TEACHER', 'USER'],
    required: true,
    index: true,
  },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: {
    type: String,
    enum: ['STUDENT_DOCUMENT', 'TEACHER_DOCUMENT', 'CERTIFICATE'],
    required: true,
    index: true,
  },
  title: { type: String, required: true, trim: true, minlength: 1, maxlength: 200 },
  originalName: { type: String, required: true, trim: true, maxlength: 255 },
  mimeType: { type: String, required: true, trim: true, maxlength: 100 },
  sizeBytes: { type: Number, required: true, min: 1, max: 10 * 1024 * 1024 },
  storageRef: { type: storageRefSchema, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: {
    type: String,
    enum: ['ACTIVE', 'ARCHIVED'],
    required: true,
    default: 'ACTIVE',
    index: true,
  },
  archivedAt: { type: Date, default: null },
  retentionStartAt: { type: Date, default: null },
}, { timestamps: true, strict: 'throw' });

centralDocumentSchema.index({ ownerType: 1, ownerId: 1, status: 1, createdAt: -1 });
centralDocumentSchema.index({ category: 1, createdAt: -1 });

centralDocumentSchema.pre('save', function protectCentralDocument() {
  if (!this.isNew) {
    const mutablePaths = new Set(['status', 'archivedAt', 'updatedAt']);
    const changed = this.modifiedPaths().filter((path) => !mutablePaths.has(path));
    if (changed.length > 0) {
      throw new Error('Only archive lifecycle changes are allowed on central documents');
    }
  }
});

centralDocumentSchema.pre([
  'findOneAndUpdate',
  'updateOne',
  'updateMany',
], function protectCentralDocumentMutation() {
  const update = this.getUpdate() || {};
  const set = update.$set || update;
  const allowed = Object.keys(set).every((key) => ['status', 'archivedAt', 'updatedAt'].includes(key));
  if (!allowed) throw new Error('Only archive lifecycle changes are allowed on central documents');
  if (set.status && set.status !== 'ARCHIVED') {
    throw new Error('Central documents may only transition to ARCHIVED');
  }
});

centralDocumentSchema.pre([
  'deleteOne',
  'deleteMany',
  'findOneAndDelete',
  'findOneAndRemove',
], function protectCentralDocumentDelete() {
  throw new Error('Central document delete is not supported');
});

module.exports = mongoose.models.CentralDocument
  || mongoose.model('CentralDocument', centralDocumentSchema);
