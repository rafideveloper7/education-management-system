const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true, trim: true, maxlength: 50 },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: String, required: true, trim: true, maxlength: 100, index: true },
  subject: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true, maxlength: 10000 },
  status: {
    type: String,
    enum: ['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'],
    required: true,
    default: 'SUBMITTED',
    index: true,
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolvedAt: { type: Date, default: null },
  resolutionNote: { type: String, trim: true, maxlength: 5000, default: null },
}, { timestamps: true, strict: 'throw' });

complaintSchema.index({ submittedBy: 1, createdAt: -1 });
complaintSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });

module.exports = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);
