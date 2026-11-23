const { randomUUID } = require('crypto');
const { Readable } = require('stream');
const cloudinary = require('cloudinary').v2;
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');

let configured = false;

const configure = () => {
  if (configured) return;
  const { cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret } = env;
  if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
    throw new ApiError(503, 'File storage is not configured', { code: 'FILE_STORAGE_UNAVAILABLE' });
  }
  cloudinary.config({
    cloud_name: cloudinaryCloudName,
    api_key: cloudinaryApiKey,
    api_secret: cloudinaryApiSecret,
    secure: true,
  });
  configured = true;
};

const upload = (file, purpose) => new Promise((resolve, reject) => {
  try {
    configure();
    const publicId = randomUUID();
    const stream = cloudinary.uploader.upload_stream({
      folder: `eduos/${purpose}`,
      public_id: publicId,
      resource_type: 'raw',
      type: 'authenticated',
      access_mode: 'authenticated',
      overwrite: false,
      unique_filename: false,
      use_filename: false,
      timeout: 30000,
    }, (error, result) => {
      if (error || !result?.public_id || !result?.bytes) {
        return reject(new ApiError(503, 'File storage provider rejected the upload', {
          code: 'FILE_STORAGE_UNAVAILABLE',
        }));
      }
      return resolve({
        provider: 'cloudinary',
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format || file.format,
        mimeType: file.mimeType,
        originalName: file.originalName,
        sizeBytes: result.bytes,
        uploadedAt: new Date(),
      });
    });
    stream.end(file.buffer);
  } catch (error) {
    reject(error instanceof ApiError ? error : new ApiError(503, 'File storage provider is unavailable', {
      code: 'FILE_STORAGE_UNAVAILABLE',
    }));
  }
});

const destroy = async (publicId) => {
  configure();
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: 'raw',
    type: 'authenticated',
    invalidate: true,
  });
  if (!['ok', 'not found'].includes(result?.result)) throw new Error('Storage cleanup was not confirmed');
};

const download = async ({ publicId, format }) => {
  try {
    configure();
    const url = cloudinary.utils.private_download_url(publicId, format, {
      resource_type: 'raw',
      type: 'authenticated',
      attachment: true,
    });
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok || !response.body) throw new Error('Provider download failed');
    return {
      body: Readable.fromWeb(response.body),
      contentLength: response.headers.get('content-length'),
    };
  } catch (error) {
    throw new ApiError(503, 'Private file is temporarily unavailable', { code: 'FILE_STORAGE_UNAVAILABLE' });
  }
};

module.exports = { upload, destroy, download };