// Admission Document Model
// Section 5.4: Secure document uploads with Cloudinary integration

const mongoose = require('mongoose');

const admissionDocumentSchema = new mongoose.Schema(
  {
    admissionApplicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdmissionApplication',
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },
    documentName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    documentDescription: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    
    // File Storage Information (Cloudinary)
    cloudinaryPublicId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    cloudinaryUrl: {
      type: String,
      required: true,
      trim: true,
    },
    secureUrl: {
      type: String,
      trim: true,
    },
    fileFormat: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    dimensions: {
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
    },
    
    // Upload Information
    uploadedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    uploadIpAddress: {
      type: String,
      trim: true,
      maxlength: 45,
    },
    uploadUserAgent: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    
    // Document Status & Verification
    status: {
      type: String,
      enum: ['UPLOADED', 'VERIFIED', 'REJECTED', 'EXPIRED'],
      required: true,
      default: 'UPLOADED',
      index: true,
    },
    verificationNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    verifiedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    verifiedAt: {
      type: Date,
      index: true,
    },
    
    // Security & Access Control
    accessLevel: {
      type: String,
      enum: ['PUBLIC', 'PROTECTED', 'PRIVATE'],
      required: true,
      default: 'PROTECTED',
      index: true,
    },
    encryptionKey: {
      type: String,
      select: false,
      trim: true,
    },
    expiryDate: {
      type: Date,
      index: true,
    },
    
    // Version Control
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    previousVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdmissionDocument',
      index: true,
    },
    isCurrentVersion: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes
admissionDocumentSchema.index({ admissionApplicationId: 1, documentType: 1, isCurrentVersion: 1 });
admissionDocumentSchema.index({ status: 1, expiryDate: 1 });
admissionDocumentSchema.index({ cloudinaryPublicId: 1 });
admissionDocumentSchema.index({ uploadedByUserId: 1, createdAt: -1 });
admissionDocumentSchema.index({ accessLevel: 1, status: 1 });

// Validation
admissionDocumentSchema.pre('validate', function validateDocument() {
  if (this.expiryDate && this.expiryDate < new Date()) {
    this.invalidate('expiryDate', 'expiryDate must be in the future');
  }
  
  if (this.fileSize > 10 * 1024 * 1024) { // 10MB limit
    this.invalidate('fileSize', 'File size must be less than 10MB');
  }
  
  const allowedFormats = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
  const fileExt = this.fileFormat.toLowerCase();
  if (!allowedFormats.includes(fileExt)) {
    this.invalidate('fileFormat', `File format ${this.fileFormat} is not allowed`);
  }
});

// Auto-update version when replacing document
admissionDocumentSchema.pre('save', async function updatePreviousVersion(next) {
  if (this.isCurrentVersion && this.isModified('cloudinaryPublicId')) {
    try {
      await this.constructor.updateMany(
        { 
          admissionApplicationId: this.admissionApplicationId,
          documentType: this.documentType,
          isCurrentVersion: true,
          _id: { $ne: this._id }
        },
        { isCurrentVersion: false }
      );
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.models.AdmissionDocument ||
  mongoose.model('AdmissionDocument', admissionDocumentSchema);