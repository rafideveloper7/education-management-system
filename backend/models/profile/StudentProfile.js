const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
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
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      default: null,
    },
    bloodGroup: {
      type: String,
      trim: true,
      maxlength: 10,
    },
    profilePicture: {
      type: String,
      default: null,
      trim: true,
    },
    admissionNo: {
      type: String,
      trim: true,
      maxlength: 40,
    },
    rollNo: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    emergencyContact: {
      type: String,
      trim: true,
      maxlength: 30,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.StudentProfile || mongoose.model('StudentProfile', studentProfileSchema);
