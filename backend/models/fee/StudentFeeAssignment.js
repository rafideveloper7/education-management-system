const mongoose = require('mongoose');

// StudentFeeAssignment links a student to a specific FeeStructure for a given
// academic session. It records the assigned amount at assignment time — this
// amount is independent of future FeeStructure edits.
//
// Duplicate assignment prevention: one assignment per student + feeStructure +
// academicSession is enforced by the unique compound index below.
// However, a student CAN have multiple assignments in the same session if they
// are for different fee structures (e.g. Tuition + Lab Fee).
const studentFeeAssignmentSchema = new mongoose.Schema({
  studentUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  feeStructureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeStructure',
    required: true,
  },
  academicSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession',
    required: true,
    index: true,
  },
  // Amount snapshotted from FeeStructure at assignment time.
  // Changing FeeStructure.amount later does NOT affect this field.
  assignedAmount: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isFinite,
      message: 'Assigned amount must be a finite number',
    },
  },
  currency: { type: String, required: true, trim: true, uppercase: true, default: 'PKR', maxlength: 3 },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['ACTIVE', 'CANCELLED'],
    required: true,
    default: 'ACTIVE',
    index: true,
  },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, strict: 'throw' });

// One active assignment per student per fee structure per academic session.
studentFeeAssignmentSchema.index(
  { studentUserId: 1, feeStructureId: 1, academicSessionId: 1 },
  { unique: true },
);

module.exports = mongoose.models.StudentFeeAssignment
  || mongoose.model('StudentFeeAssignment', studentFeeAssignmentSchema);
