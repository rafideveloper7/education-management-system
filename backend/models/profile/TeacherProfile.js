const mongoose = require('mongoose');

const teacherProfileSchema = new mongoose.Schema(
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
    employeeId: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 40,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    designation: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    qualification: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    joiningDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.TeacherProfile || mongoose.model('TeacherProfile', teacherProfileSchema);
