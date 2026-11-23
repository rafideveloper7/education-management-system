const cloudinary = require('cloudinary').v2;
const env = require('../config/env');

const configureCloudinary = () => {
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    throw new Error('Cloudinary configuration is incomplete');
  }
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
  });
};

const uploadToCloudinary = async (file, options = {}) => {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    });
    stream.end(file.buffer);
  });
};

const deleteFromCloudinary = async (publicId) => {
  configureCloudinary();
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };
