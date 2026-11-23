const crypto = require('crypto');
const LeaveRequest = require('../../models/communication/LeaveRequest');
const CommunicationAudit = require('../../models/communication/CommunicationAudit');
const ParentStudent = require('../../models/parent/ParentStudent');
const StudentEnrollment = require('../../models/student/StudentEnrollment');
const TeacherAssignment = require('../../models/teacher/TeacherAssignment');
const User = require('../../models/user/User');
const notificationService = require('../notification/notification.service');
const ApiError = require('../../utils/ApiError');
const {
  createCommunicationAuditService,
  createOneInTransaction,
  withAuditTransaction,
} = require('./audit.service');

const createLeaveRequestService = ({
  models = { LeaveRequest, CommunicationAudit, ParentStudent, StudentEnrollment, TeacherAssignment, User },
  transaction = withAuditTransaction,
  notifications = notificationService,
  now = () => new Date(),
} = {}) => {
  const audit = createCommunicationAuditService({ model: models.CommunicationAudit });
  const createReference = () => `LEV-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

  const create = async ({ actor, data }) => {
    if (!['PARENT', 'STUDENT', 'ADMIN'].includes(actor.role)) {
      throw new ApiError(403, 'This role cannot submit leave requests');
    }
    if (actor.role === 'PARENT') {
      const linked = await models.ParentStudent.exists({
        parentUserId: actor.sub,
        studentUserId: data.studentId,
        status: 'ACTIVE',
        validFrom: { $lte: now() },
        $or: [{ validTo: null }, { validTo: { $gte: now() } }],
      });
      if (!linked) throw new ApiError(403, 'Parent is not linked to this student');
    }
    if (actor.role === 'STUDENT' && String(actor.sub) !== String(data.studentId)) {
      throw new ApiError(403, 'Students can only submit leave requests for themselves');
    }
    const request = await transaction(async (session) => {
      const createdRequest = await createOneInTransaction(models.LeaveRequest, {
        ...data,
        reference: createReference(),
        requestedBy: actor.sub,
      }, session);
      await audit.record({
        session,
        entityType: 'LEAVE_REQUEST',
        entityId: createdRequest._id,
        action: 'LEAVE_REQUEST_SUBMITTED',
        performedBy: actor.sub,
        newValue: { status: createdRequest.status },
      });
      return createdRequest;
    });
    if (typeof models.User?.find === 'function') {
      const admins = await models.User.find({ role: 'ADMIN', status: 'ACTIVE' }).select('_id').lean();
      await notifications.publishSafe({
        eventId: `leave-request-submitted:${request._id}`,
        type: 'LEAVE_REQUEST_SUBMITTED',
        title: 'New Leave Request',
        message: 'A new leave request requires review.',
        recipientIds: admins.map((admin) => admin._id),
        referenceId: request._id,
        referenceType: 'LEAVE_REQUEST',
        actorId: actor.sub,
      });
    }
    return request;
  };

  const list = async ({ actor, filters }) => {
    const query = {};
    if (actor.role === 'PARENT') query.requestedBy = actor.sub;
    if (actor.role === 'STUDENT') query.studentId = actor.sub;
    if (actor.role === 'TEACHER') {
      throw new ApiError(403, 'Teacher leave request listing requires an approved academic ownership context');
    }
    if (filters.status) query.status = filters.status;
    const items = await models.LeaveRequest.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(filters.limit)
      .lean();
    return { items, pagination: { limit: filters.limit, hasMore: false, nextCursor: null } };
  };

  const get = async ({ actor, leaveRequestId }) => {
    const request = await models.LeaveRequest.findById(leaveRequestId).lean();
    if (!request) throw new ApiError(404, 'Leave request not found');
    if (actor.role !== 'ADMIN') {
      const ownRequest = String(request.requestedBy) === String(actor.sub);
      const ownStudent = actor.role === 'STUDENT' && String(request.studentId) === String(actor.sub);
      if (!ownRequest && !ownStudent) throw new ApiError(403, 'You cannot access this leave request');
      if (actor.role === 'PARENT') {
        const linked = await models.ParentStudent.exists({
          parentUserId: actor.sub,
          studentUserId: request.studentId,
          status: 'ACTIVE',
        });
        if (!linked) throw new ApiError(403, 'Parent is not linked to this student');
      }
    }
    return request;
  };

  const review = async ({ actor, leaveRequestId, status, reviewNote }) => {
    if (!['ADMIN', 'TEACHER'].includes(actor.role)) {
      throw new ApiError(403, 'Only an administrator or teacher can review leave requests');
    }
    const request = await models.LeaveRequest.findById(leaveRequestId);
    if (!request) throw new ApiError(404, 'Leave request not found');
    if (actor.role === 'TEACHER') {
      const enrollment = await models.StudentEnrollment.findOne({
        studentUserId: request.studentId,
        status: { $in: ['ACTIVE', 'COMPLETED', 'ENDED', 'SUSPENDED'] },
        validFrom: { $lte: now() },
        $or: [{ validTo: null }, { validTo: { $gte: now() } }],
      }).lean();
      if (!enrollment) throw new ApiError(403, 'Teacher is not authorized to review this student leave request');
      const assignment = await models.TeacherAssignment.exists({
        teacherUserId: actor.sub,
        academicSessionId: enrollment.academicSessionId,
        classId: enrollment.classId,
        sectionId: enrollment.sectionId,
        status: { $in: ['ACTIVE', 'ENDED'] },
        validFrom: { $lte: now() },
        $or: [{ validTo: null }, { validTo: { $gte: now() } }],
      });
      if (!assignment) throw new ApiError(403, 'Teacher is not assigned to this student');
    }
    if (request.status !== 'PENDING') throw new ApiError(409, 'This leave request has already been reviewed');
    if (status === 'REJECTED' && !reviewNote) {
      throw new ApiError(400, 'reviewNote is required when rejecting a leave request');
    }
    const previousStatus = request.status;
    request.status = status;
    request.reviewedBy = actor.sub;
    request.reviewNote = reviewNote || null;
    request.reviewedAt = now();
    await transaction(async (session) => {
      await request.save({ session });
      await audit.record({
        session,
        entityType: 'LEAVE_REQUEST',
        entityId: request._id,
        action: `LEAVE_REQUEST_${status}`,
        performedBy: actor.sub,
        previousValue: { status: previousStatus },
        newValue: { status },
      });
    });
    await notifications.publishSafe({
      eventId: `leave-request-${status === 'APPROVED' ? 'approved' : 'rejected'}:${request._id}`,
      type: status === 'APPROVED' ? 'LEAVE_REQUEST_APPROVED' : 'LEAVE_REQUEST_REJECTED',
      title: status === 'APPROVED' ? 'Leave Request Approved' : 'Leave Request Rejected',
      message: status === 'APPROVED'
        ? 'Your leave request has been approved.'
        : 'Your leave request has been rejected.',
      recipientIds: [request.requestedBy],
      referenceId: request._id,
      referenceType: 'LEAVE_REQUEST',
      actorId: actor.sub,
    });
    return request;
  };

  return { create, list, get, review };
};

module.exports = { createLeaveRequestService };
