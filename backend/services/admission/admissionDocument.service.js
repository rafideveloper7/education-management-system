// Admission Document Service
// Section 5.4: Secure document upload and management

const AdmissionDocument = require('../../models/admission/AdmissionDocument');
const AdmissionApplication = require('../../models/admission/AdmissionApplication');
const { ApiError } = require('../../utils/ApiError');
const { uploadToCloudinary, deleteFromCloudinary } = require('../../utils/fileUpload');

class AdmissionDocumentService {
  // Upload document for admission application
  async uploadDocument(applicationId, file, documentData, uploadedByUserId, ipAddress = null, userAgent = null) {
    // Verify application exists and is in correct state
    const application = await AdmissionApplication.findById(applicationId);
    if (!application) {
      throw new ApiError(404, 'Admission application not found');
    }

    if (!['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REQUIRES_MORE_INFO'].includes(application.status)) {
      throw new ApiError(400, 'Documents cannot be uploaded for applications in current status');
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(file, {
      folder: `admission/${applicationId}`,
      resource_type: 'auto',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' }, // Limit size for images
        { quality: 'auto:good' },
      ],
    });

    if (!uploadResult) {
      throw new ApiError(500, 'Failed to upload document');
    }

    // Create document record
    const document = new AdmissionDocument({
      admissionApplicationId: applicationId,
      documentType: documentData.documentType,
      documentName: documentData.documentName || file.originalname,
      documentDescription: documentData.documentDescription || '',
      cloudinaryPublicId: uploadResult.public_id,
      cloudinaryUrl: uploadResult.secure_url,
      secureUrl: uploadResult.secure_url,
      fileFormat: uploadResult.format,
      fileSize: uploadResult.bytes,
      mimeType: file.mimetype,
      dimensions: uploadResult.width && uploadResult.height ? {
        width: uploadResult.width,
        height: uploadResult.height,
      } : null,
      uploadedByUserId,
      uploadIpAddress: ipAddress,
      uploadUserAgent: userAgent,
      status: 'UPLOADED',
      accessLevel: 'PROTECTED',
    });

    await document.save();
    return document;
  }

  // Get document by ID with access control
  async getDocumentById(documentId, userId, userRole) {
    const document = await AdmissionDocument.findById(documentId)
      .populate('admissionApplicationId', 'applicantUserId status applicantFullName')
      .populate('uploadedByUserId', 'fullName email');

    if (!document) {
      throw new ApiError(404, 'Document not found');
    }

    // Access control
    if (userRole === 'ADMIN') {
      return document; // Admin can view all
    }

    const application = await AdmissionApplication.findById(document.admissionApplicationId);
    
    if (userRole === 'PUBLIC_USER' || userRole === 'STUDENT') {
      if (application.applicantUserId && application.applicantUserId.toString() !== userId.toString()) {
        throw new ApiError(403, 'You do not have permission to view this document');
      }
    }

    // Check document status
    if (document.status === 'REJECTED' || document.status === 'EXPIRED') {
      throw new ApiError(400, `Document is ${document.status.toLowerCase()}`);
    }

    return document;
  }

  // List documents for an application
  async listApplicationDocuments(applicationId, userId, userRole) {
    // Verify access to application
    const application = await AdmissionApplication.findById(applicationId);
    if (!application) {
      throw new ApiError(404, 'Admission application not found');
    }

    // Access control
    if (userRole !== 'ADMIN') {
      if (application.applicantUserId && application.applicantUserId.toString() !== userId.toString()) {
        throw new ApiError(403, 'You do not have permission to view these documents');
      }
    }

    const documents = await AdmissionDocument.find({
      admissionApplicationId: applicationId,
      isCurrentVersion: true,
      status: { $nin: ['EXPIRED'] },
    })
    .populate('verifiedByUserId', 'fullName email')
    .sort({ documentType: 1, createdAt: -1 });

    return documents;
  }

  // Verify document (admin only)
  async verifyDocument(documentId, verifiedByUserId, verificationNotes, status) {
    const document = await AdmissionDocument.findById(documentId);
    if (!document) {
      throw new ApiError(404, 'Document not found');
    }

    if (!['UPLOADED', 'REJECTED'].includes(document.status)) {
      throw new ApiError(400, 'Document cannot be verified in current status');
    }

    document.status = status;
    document.verificationNotes = verificationNotes;
    document.verifiedByUserId = verifiedByUserId;
    document.verifiedAt = new Date();

    await document.save();
    return document;
  }

  // Replace document (upload new version)
  async replaceDocument(documentId, file, documentData, userId, ipAddress = null, userAgent = null) {
    const existingDocument = await AdmissionDocument.findById(documentId);
    if (!existingDocument) {
      throw new ApiError(404, 'Document not found');
    }

    // Check permissions
    const application = await AdmissionApplication.findById(existingDocument.admissionApplicationId);
    if (application.applicantUserId && application.applicantUserId.toString() !== userId.toString()) {
      throw new ApiError(403, 'You do not have permission to replace this document');
    }

    if (!['UPLOADED', 'REJECTED'].includes(existingDocument.status)) {
      throw new ApiError(400, 'Document cannot be replaced in current status');
    }

    // Upload new version
    const uploadResult = await uploadToCloudinary(file, {
      folder: `admission/${existingDocument.admissionApplicationId}`,
      resource_type: 'auto',
    });

    if (!uploadResult) {
      throw new ApiError(500, 'Failed to upload document');
    }

    // Create new version
    const newDocument = new AdmissionDocument({
      admissionApplicationId: existingDocument.admissionApplicationId,
      documentType: existingDocument.documentType,
      documentName: documentData.documentName || file.originalname,
      documentDescription: documentData.documentDescription || existingDocument.documentDescription,
      cloudinaryPublicId: uploadResult.public_id,
      cloudinaryUrl: uploadResult.secure_url,
      secureUrl: uploadResult.secure_url,
      fileFormat: uploadResult.format,
      fileSize: uploadResult.bytes,
      mimeType: file.mimetype,
      dimensions: uploadResult.width && uploadResult.height ? {
        width: uploadResult.width,
        height: uploadResult.height,
      } : null,
      uploadedByUserId: userId,
      uploadIpAddress: ipAddress,
      uploadUserAgent: userAgent,
      status: 'UPLOADED',
      accessLevel: existingDocument.accessLevel,
      version: existingDocument.version + 1,
      previousVersionId: existingDocument._id,
    });

    // Mark old version as not current
    existingDocument.isCurrentVersion = false;
    await existingDocument.save();
    await newDocument.save();

    // Delete old file from Cloudinary if no longer needed
    if (existingDocument.cloudinaryPublicId) {
      await deleteFromCloudinary(existingDocument.cloudinaryPublicId).catch(console.error);
    }

    return newDocument;
  }

  // Delete document
  async deleteDocument(documentId, userId, userRole) {
    const document = await AdmissionDocument.findById(documentId);
    if (!document) {
      throw new ApiError(404, 'Document not found');
    }

    // Check permissions
    if (userRole !== 'ADMIN') {
      const application = await AdmissionApplication.findById(document.admissionApplicationId);
      if (application.applicantUserId && application.applicantUserId.toString() !== userId.toString()) {
        throw new ApiError(403, 'You do not have permission to delete this document');
      }
    }

    // Delete from Cloudinary
    if (document.cloudinaryPublicId) {
      await deleteFromCloudinary(document.cloudinaryPublicId);
    }

    // Delete document record
    await document.deleteOne();
    
    return { success: true, message: 'Document deleted successfully' };
  }
}

module.exports = new AdmissionDocumentService();