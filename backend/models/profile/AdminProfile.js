const mongoose = require('mongoose');

const adminProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    profilePicture: {
      type: String,
      default: null,
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.AdminProfile || mongoose.model('AdminProfile', adminProfileSchema);
