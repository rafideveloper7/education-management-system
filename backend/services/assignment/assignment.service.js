const mongoose = require('mongoose');
const Assignment = require('../../models/assignment/Assignment');
const Submission = require('../../models/assignment/Submission');
const AssignmentAudit = require('../../models/assignment/AssignmentAudit');
const UploadPolicy = require('../../models/assignment/UploadPolicy');
const AcademicSession = require('../../models/academic/AcademicSession');
const AcademicClass = require('../../models/academic/Class');
const Section = require('../../models/academic/Section');
const Subject = require('../../models/academic/Subject');
const ClassSubject = require('../../models/academic/ClassSubject');
const StudentEnrollment = require('../../models/student/StudentEnrollment');
const TeacherAssignment = require('../../models/teacher/TeacherAssignment');
const ParentStudent = require('../../models/parent/ParentStudent');
const cloudinaryStorage = require('./cloudinary-storage.service');
const ApiError = require('../../utils/ApiError');

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const HARD_UPLOAD_LIMIT_BYTES = 50 * 1024 * 1024;
const DEFAULT_UPLOAD_POLICY = Object.freeze({
  attachmentMaxBytes: 10 * 1024 * 1024,
  submissionMaxBytes: 20 * 1024 * 1024,
});
const FILE_CLEANUP_WARNING = 'Group 12 obsolete-file cleanup failed';

const encodeCursor = (record, sortField) => Buffer.from(JSON.stringify({
  version: 1,
  sortField,
  value: new Date(record[sortField]).toISOString(),
  id: String(record._id),
})).toString('base64url');

const decodeCursor = (cursor, sortField) => {
  try {
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    const date = new Date(value.value);
    if (value.version !== 1 || value.sortField !== sortField
      || !OBJECT_ID_PATTERN.test(value.id) || Number.isNaN(date.getTime())) throw new Error();
    return { date, id: value.id };
  } catch (error) {
    throw new ApiError(400, 'cursor must be a valid assignment cursor', { code: 'INVALID_CURSOR' });
  }
};

const createAssignmentService = ({
  models = {
    Assignment,
    Submission,
    AssignmentAudit,
    UploadPolicy,
    AcademicSession,
    AcademicClass,
    Section,
    Subject,
    ClassSubject,
    StudentEnrollment,
    TeacherAssignment,
    ParentStudent,
  },
  storage = cloudinaryStorage,
  runInTransaction = async (operation) => {
    const session = await mongoose.startSession();
    try {
      let result;
      await session.withTransaction(async () => { result = await operation(session); });
      return result;
    } finally {
      await session.endSession();
    }
  },
  now = () => new Date(),
  logger = console,
} = {}) => {
  const requireId = (value, field) => {
    if (!OBJECT_ID_PATTERN.test(String(value || ''))) {
      throw new ApiError(400, `${field} must be a valid ObjectId`, { code: 'INVALID_ID' });
    }
  };

  const listPage = async (Model, filter, { limit = 50, cursor, sortField = 'createdAt' } = {}) => {
    const position = cursor ? decodeCursor(cursor, sortField) : null;
    const query = cursor
      ? { $and: [filter, { $or: [
        { [sortField]: { $lt: position.date } },
        { [sortField]: position.date, _id: { $lt: position.id } },
      ] }] }
      : filter;
    const records = await Model.find(query)
      .sort({ [sortField]: -1, _id: -1 })
      .limit(limit + 1)
      .lean();
    const hasMore = records.length > limit;
    const items = hasMore ? records.slice(0, limit) : records;
    return {
      items,
      pagination: {
        limit,
        hasMore,
        nextCursor: hasMore ? encodeCursor(items[items.length - 1], sortField) : null,
      },
    };
  };

  const getUploadPolicy = async () => {
    const policy = await models.UploadPolicy.findById('default').lean();
    return {
      ...DEFAULT_UPLOAD_POLICY,
      ...(policy || {}),
      attachmentMaxBytes: Math.min(policy?.attachmentMaxBytes ?? DEFAULT_UPLOAD_POLICY.attachmentMaxBytes, HARD_UPLOAD_LIMIT_BYTES),
      submissionMaxBytes: Math.min(policy?.submissionMaxBytes ?? DEFAULT_UPLOAD_POLICY.submissionMaxBytes, HARD_UPLOAD_LIMIT_BYTES),
      hardLimitBytes: HARD_UPLOAD_LIMIT_BYTES,
    };
  };

  const requireAcademicContext = async (context) => {
    const [session, academicClass, section, subject, offering] = await Promise.all([
      models.AcademicSession.findById(context.academicSessionId).lean(),
      models.AcademicClass.findById(context.classId).lean(),
      models.Section.findById(context.sectionId).lean(),
      models.Subject.findById(context.subjectId).lean(),
      models.ClassSubject.findOne({ classId: context.classId, subjectId: context.subjectId, status: 'ACTIVE' }).lean(),
    ]);
    if (!session || !academicClass || !section || !subject || !offering
      || section.classId.toString() !== String(context.classId)) {
      throw new ApiError(400, 'Assignment academic references must identify an active, matching context', {
        code: 'INVALID_ASSIGNMENT_CONTEXT',
      });
    }
    if (session.status !== 'ACTIVE' || academicClass.status !== 'ACTIVE'
      || section.status !== 'ACTIVE' || subject.status !== 'ACTIVE') {
      throw new ApiError(409, 'Assignments require an active session, class, section, and subject', {
        code: 'INACTIVE_ASSIGNMENT_CONTEXT',
      });
    }
    return { session, academicClass, section, subject };
  };

  const requireTeacherScope = async (actor, assignmentOrContext) => {
    if (actor?.role === 'ADMIN') return;
    if (actor?.role !== 'TEACHER') throw new ApiError(403, 'This account cannot manage assignments');
    const context = assignmentOrContext;
    const assigned = await models.TeacherAssignment.exists({
      teacherUserId: actor.sub,
      academicSessionId: context.academicSessionId,
      classId: context.classId,
      sectionId: context.sectionId,
      subjectId: context.subjectId,
      status: 'ACTIVE',
      validFrom: { $lte: now() },
      $or: [{ validTo: null }, { validTo: { $gte: now() } }],
    });
    if (!assigned) throw new ApiError(403, 'Teacher is not assigned to this assignment context');
  };

  const requireStudentEnrollment = async (studentUserId, assignment, session) => {
    const currentTime = now();
    let query = models.StudentEnrollment.findOne({
      studentUserId,
      academicSessionId: assignment.academicSessionId,
      classId: assignment.classId,
      sectionId: assignment.sectionId,
      status: 'ACTIVE',
      validFrom: { $lte: currentTime },
      $or: [{ validTo: null }, { validTo: { $gte: currentTime } }],
    });
    if (session && typeof query.session === 'function') query = query.session(session);
    const enrollment = await query.lean();
    if (!enrollment) throw new ApiError(403, 'Student does not have an active enrollment for this assignment');
    return enrollment;
  };

  const requireAssignment = async (assignmentId) => {
    requireId(assignmentId, 'assignmentId');
    const assignment = await models.Assignment.findById(assignmentId).lean();
    if (!assignment) throw new ApiError(404, 'Assignment not found', { code: 'ASSIGNMENT_NOT_FOUND' });
    return assignment;
  };

  const lockPublishedAssignment = async (assignmentId, session) => {
    let query = models.Assignment.findById(assignmentId);
    if (session && typeof query.session === 'function') query = query.session(session);
    const current = await query.lean();
    if (!current || current.status !== 'PUBLISHED') {
      throw new ApiError(409, 'Assignment is no longer accepting submissions');
    }
    const locked = await models.Assignment.findOneAndUpdate({
      _id: current._id,
      status: 'PUBLISHED',
      dueAt: current.dueAt,
      ...(current.__v === undefined ? {} : { __v: current.__v }),
    }, {
      $set: { dueAt: current.dueAt },
      $inc: { __v: 1 },
    }, {
      new: true,
      runValidators: true,
      session,
      timestamps: false,
    }).lean();
    if (!locked) throw new ApiError(409, 'Assignment deadline changed during the submission; retry the request');
    return locked;
  };

  const requireAssignmentManager = async (actor, assignment) => {
    await requireTeacherScope(actor, assignment);
  };

  const requireStudentVisibleAssignment = async (actor, assignment) => {
    if (actor?.role === 'STUDENT') {
      await requireStudentEnrollment(actor.sub, assignment);
      return;
    }
    if (actor?.role === 'TEACHER') {
      await requireTeacherScope(actor, assignment);
      return;
    }
    if (actor?.role === 'PARENT') {
      const relationships = await models.ParentStudent.find({
        parentUserId: actor.sub,
        status: 'ACTIVE',
        validFrom: { $lte: now() },
        $or: [{ validTo: null }, { validTo: { $gte: now() } }],
      }).select('studentUserId').lean();
      const studentIds = relationships.map(({ studentUserId }) => studentUserId);
      const enrolledChild = await models.StudentEnrollment.exists({
        studentUserId: { $in: studentIds },
        academicSessionId: assignment.academicSessionId,
        classId: assignment.classId,
        sectionId: assignment.sectionId,
        status: 'ACTIVE',
        validFrom: { $lte: now() },
        $or: [{ validTo: null }, { validTo: { $gte: now() } }],
      });
      if (!enrolledChild) throw new ApiError(403, 'No linked child is enrolled for this assignment');
      return;
    }
    if (actor?.role !== 'ADMIN') throw new ApiError(403, 'This account cannot access this assignment');
  };

  const createAssignment = async ({ actor, data }) => {
    requireId(actor?.sub, 'authenticated user');
    await requireAcademicContext(data);
    await requireTeacherScope(actor, data);
    return models.Assignment.create({ ...data, createdBy: actor.sub, status: 'DRAFT', publishedAt: null });
  };

  const updateAssignment = async ({ actor, assignmentId, data }) => {
    const assignment = await requireAssignment(assignmentId);
    await requireAssignmentManager(actor, assignment);
    if (assignment.status !== 'DRAFT') {
      throw new ApiError(409, 'Only draft assignments can be edited', { code: 'ASSIGNMENT_NOT_EDITABLE' });
    }
    const nextContext = { ...assignment, ...data };
    await requireAcademicContext(nextContext);
    const updated = await models.Assignment.findOneAndUpdate({ _id: assignment._id, status: 'DRAFT' }, {
      $set: data,
    }, { new: true, runValidators: true }).lean();
    if (!updated) throw new ApiError(409, 'Assignment changed while it was being updated');
    return updated;
  };

  const publishAssignment = async ({ actor, assignmentId }) => {
    const assignment = await requireAssignment(assignmentId);
    await requireAssignmentManager(actor, assignment);
    if (assignment.status !== 'DRAFT') throw new ApiError(409, 'Only draft assignments can be published');
    const updated = await models.Assignment.findOneAndUpdate({ _id: assignment._id, status: 'DRAFT' }, {
      $set: { status: 'PUBLISHED', publishedAt: now() },
    }, { new: true, runValidators: true }).lean();
    if (!updated) throw new ApiError(409, 'Assignment changed while it was being published');
    return updated;
  };

  const closeAssignment = async ({ actor, assignmentId }) => {
    const assignment = await requireAssignment(assignmentId);
    await requireAssignmentManager(actor, assignment);
    if (assignment.status !== 'PUBLISHED') throw new ApiError(409, 'Only published assignments can be closed');
    const updated = await models.Assignment.findOneAndUpdate({ _id: assignment._id, status: 'PUBLISHED' }, {
      $set: { status: 'CLOSED' },
    }, { new: true, runValidators: true }).lean();
    if (!updated) throw new ApiError(409, 'Assignment changed while it was being closed');
    return updated;
  };

  const submitFile = async ({ actor, assignmentId, file }) => {
    requireId(actor?.sub, 'authenticated user');
    if (actor.role !== 'STUDENT') throw new ApiError(403, 'Only students can submit assignment work');
    const assignment = await requireAssignment(assignmentId);
    if (assignment.status !== 'PUBLISHED') throw new ApiError(409, 'Assignment is not accepting submissions');
    await requireStudentEnrollment(actor.sub, assignment);
    const policy = await getUploadPolicy();
    if (!file) throw new ApiError(400, 'A submission file is required', { code: 'FILE_REQUIRED' });
    if (file.sizeBytes > policy.submissionMaxBytes) {
      throw new ApiError(413, 'Submission file exceeds the configured upload limit', { code: 'UPLOAD_LIMIT_EXCEEDED' });
    }
    if (await models.Submission.exists({ assignmentId: assignment._id, studentUserId: actor.sub })) {
      throw new ApiError(409, 'A submission already exists; use the replacement endpoint', { code: 'SUBMISSION_EXISTS' });
    }

    let storedFile;
    try {
      storedFile = await storage.upload(file, 'submission');
      return await runInTransaction(async (session) => {
        const currentAssignment = await lockPublishedAssignment(assignment._id, session);
        const enrollment = await requireStudentEnrollment(actor.sub, currentAssignment, session);
        const submittedAt = now();
        const created = await models.Submission.create([{
          assignmentId: currentAssignment._id,
          studentUserId: actor.sub,
          enrollmentId: enrollment._id,
          file: storedFile,
          submittedAt,
          status: submittedAt <= currentAssignment.dueAt ? 'ON_TIME' : 'LATE',
        }], { session });
        return Array.isArray(created) ? created[0] : created;
      });
    } catch (error) {
      if (storedFile?.publicId) await cleanupFile(storedFile.publicId);
      if (error?.code === 11000) {
        throw new ApiError(409, 'A submission already exists; use the replacement endpoint', { code: 'SUBMISSION_EXISTS' });
      }
      throw error;
    }
  };

  const replaceSubmissionFile = async ({ actor, submissionId, file }) => {
    requireId(submissionId, 'submissionId');
    const current = await models.Submission.findById(submissionId).lean();
    if (!current) throw new ApiError(404, 'Submission not found', { code: 'SUBMISSION_NOT_FOUND' });
    if (actor?.role !== 'STUDENT' || String(current.studentUserId) !== String(actor.sub)) {
      throw new ApiError(403, 'Students can replace only their own submission');
    }
    const assignment = await requireAssignment(current.assignmentId);
    if (assignment.status !== 'PUBLISHED') throw new ApiError(409, 'Assignment is not accepting replacements');
    if (now() > assignment.dueAt) throw new ApiError(409, 'Submission replacement deadline has passed', {
      code: 'REPLACEMENT_DEADLINE_PASSED',
    });
    await requireStudentEnrollment(actor.sub, assignment);
    const policy = await getUploadPolicy();
    if (!file) throw new ApiError(400, 'A replacement file is required', { code: 'FILE_REQUIRED' });
    if (file.sizeBytes > policy.submissionMaxBytes) {
      throw new ApiError(413, 'Submission file exceeds the configured upload limit', { code: 'UPLOAD_LIMIT_EXCEEDED' });
    }

    let storedFile;
    try {
      storedFile = await storage.upload(file, 'submission');
      const updated = await runInTransaction(async (session) => {
        const currentAssignment = await lockPublishedAssignment(assignment._id, session);
        if (now() > currentAssignment.dueAt) {
          throw new ApiError(409, 'Submission replacement deadline has passed', {
            code: 'REPLACEMENT_DEADLINE_PASSED',
          });
        }
        await requireStudentEnrollment(actor.sub, currentAssignment, session);
        const submittedAt = now();
        const replacement = await models.Submission.findOneAndUpdate({
          _id: current._id,
          'file.publicId': current.file.publicId,
        }, {
          $set: {
            file: storedFile,
            submittedAt,
            status: submittedAt <= currentAssignment.dueAt ? 'ON_TIME' : 'LATE',
          },
        }, { new: true, runValidators: true, session }).lean();
        if (!replacement) throw new ApiError(409, 'Submission changed during replacement; retry after refreshing');
        return replacement;
      });
      await cleanupFile(current.file.publicId);
      return updated;
    } catch (error) {
      if (storedFile?.publicId) await cleanupFile(storedFile.publicId);
      throw error;
    }
  };

  const authorizeSubmissionUpload = async ({ actor, assignmentId }) => {
    requireId(actor?.sub, 'authenticated user');
    if (actor.role !== 'STUDENT') throw new ApiError(403, 'Only students can submit assignment work');
    const assignment = await requireAssignment(assignmentId);
    if (assignment.status !== 'PUBLISHED') throw new ApiError(409, 'Assignment is not accepting submissions');
    await requireStudentEnrollment(actor.sub, assignment);
    if (await models.Submission.exists({ assignmentId: assignment._id, studentUserId: actor.sub })) {
      throw new ApiError(409, 'A submission already exists; use the replacement endpoint', { code: 'SUBMISSION_EXISTS' });
    }
  };

  const authorizeReplacement = async ({ actor, submissionId }) => {
    requireId(submissionId, 'submissionId');
    const submission = await models.Submission.findById(submissionId).lean();
    if (!submission) throw new ApiError(404, 'Submission not found', { code: 'SUBMISSION_NOT_FOUND' });
    if (actor?.role !== 'STUDENT' || String(submission.studentUserId) !== String(actor.sub)) {
      throw new ApiError(403, 'Students can replace only their own submission');
    }
    const assignment = await requireAssignment(submission.assignmentId);
    if (assignment.status !== 'PUBLISHED' || now() > assignment.dueAt) {
      throw new ApiError(409, 'Submission replacement is not allowed after the effective deadline', {
        code: 'REPLACEMENT_DEADLINE_PASSED',
      });
    }
    await requireStudentEnrollment(actor.sub, assignment);
  };

  const cleanupFile = async (publicId) => {
    try {
      await storage.destroy(publicId);
    } catch (error) {
      logger.error(FILE_CLEANUP_WARNING, { publicId, code: error?.http_code || error?.code || 'STORAGE_ERROR' });
    }
  };

  const extendDeadline = async ({ actor, assignmentId, dueAt, reason }) => {
    const assignment = await requireAssignment(assignmentId);
    await requireAssignmentManager(actor, assignment);
    if (assignment.status !== 'PUBLISHED') throw new ApiError(409, 'Only published assignments can have their deadline extended');
    if (dueAt <= assignment.dueAt) throw new ApiError(400, 'New deadline must be later than the current deadline', {
      code: 'DEADLINE_MUST_EXTEND',
    });
    const changedAt = now();
    return runInTransaction(async (session) => {
      const updated = await models.Assignment.findOneAndUpdate({
        _id: assignment._id,
        dueAt: assignment.dueAt,
        status: 'PUBLISHED',
      }, { $set: { dueAt } }, { new: true, runValidators: true, session }).lean();
      if (!updated) throw new ApiError(409, 'Assignment changed while its deadline was being extended');
      await models.Submission.updateMany({ assignmentId: assignment._id }, [{
        $set: {
          status: { $cond: [{ $lte: ['$submittedAt', dueAt] }, 'ON_TIME', 'LATE'] },
          updatedAt: changedAt,
        },
      }], { session });
      await models.AssignmentAudit.create([{
        resourceType: 'ASSIGNMENT',
        resourceId: assignment._id,
        actorUserId: actor.sub,
        action: 'DEADLINE_EXTENDED',
        previousValue: { dueAt: assignment.dueAt },
        nextValue: { dueAt },
        reason,
        createdAt: changedAt,
      }], { session });
      return updated;
    });
  };

  const updateUploadLimits = async ({ actor, attachmentMaxBytes, submissionMaxBytes }) => {
    requireId(actor?.sub, 'authenticated user');
    const previous = await getUploadPolicy();
    attachmentMaxBytes ??= previous.attachmentMaxBytes;
    submissionMaxBytes ??= previous.submissionMaxBytes;
    if (![attachmentMaxBytes, submissionMaxBytes].every((value) => Number.isInteger(value) && value > 0)) {
      throw new ApiError(400, 'Upload limits must be positive whole-byte values', { code: 'INVALID_UPLOAD_LIMIT' });
    }
    if (attachmentMaxBytes > HARD_UPLOAD_LIMIT_BYTES || submissionMaxBytes > HARD_UPLOAD_LIMIT_BYTES) {
      throw new ApiError(400, 'Upload limits cannot exceed the system hard limit', { code: 'UPLOAD_LIMIT_ABOVE_HARD_CAP' });
    }
    return runInTransaction(async (session) => {
      const updated = await models.UploadPolicy.findOneAndUpdate({ _id: 'default' }, {
        $set: { attachmentMaxBytes, submissionMaxBytes, updatedBy: actor.sub },
        $setOnInsert: { _id: 'default' },
      }, { upsert: true, new: true, runValidators: true, session }).lean();
      await models.AssignmentAudit.create([{
        resourceType: 'UPLOAD_POLICY',
        actorUserId: actor.sub,
        action: 'UPLOAD_LIMITS_CHANGED',
        previousValue: {
          attachmentMaxBytes: previous.attachmentMaxBytes,
          submissionMaxBytes: previous.submissionMaxBytes,
        },
        nextValue: { attachmentMaxBytes, submissionMaxBytes },
      }], { session });
      return updated;
    });
  };

  const listStudentAssignments = async ({ actor, filters = {} }) => {
    requireId(actor?.sub, 'authenticated user');
    if (actor.role !== 'STUDENT') throw new ApiError(403, 'This account cannot list student assignments');
    const enrollments = await models.StudentEnrollment.find({
      studentUserId: actor.sub,
      status: 'ACTIVE',
      validFrom: { $lte: now() },
      $or: [{ validTo: null }, { validTo: { $gte: now() } }],
    }).lean();
    if (enrollments.length === 0) return { items: [], pagination: { limit: filters.limit || 50, hasMore: false, nextCursor: null } };
    const contexts = enrollments
      .filter((enrollment) => !filters.academicSessionId
        || String(enrollment.academicSessionId) === String(filters.academicSessionId))
      .map(({ academicSessionId, classId, sectionId }) => ({ academicSessionId, classId, sectionId }));
    if (contexts.length === 0) return { items: [], pagination: { limit: filters.limit || 50, hasMore: false, nextCursor: null } };
    const query = { status: 'PUBLISHED', $and: [{ $or: contexts }] };
    if (filters.subjectId) query.subjectId = filters.subjectId;
    return listPage(models.Assignment, query, filters);
  };

  const getStudentAssignment = async ({ actor, assignmentId }) => {
    const assignment = await requireAssignment(assignmentId);
    if (assignment.status !== 'PUBLISHED') throw new ApiError(404, 'Assignment not found', { code: 'ASSIGNMENT_NOT_FOUND' });
    await requireStudentVisibleAssignment(actor, assignment);
    return assignment;
  };

  const getSubmission = async ({ actor, submissionId }) => {
    requireId(submissionId, 'submissionId');
    const submission = await models.Submission.findById(submissionId).lean();
    if (!submission) throw new ApiError(404, 'Submission not found', { code: 'SUBMISSION_NOT_FOUND' });
    const assignment = await requireAssignment(submission.assignmentId);
    if (actor?.role === 'STUDENT' && String(submission.studentUserId) === String(actor.sub)) return submission;
    if (actor?.role === 'TEACHER') {
      await requireTeacherScope(actor, assignment);
      return submission;
    }
    if (actor?.role === 'PARENT') {
      const linked = await models.ParentStudent.exists({
        parentUserId: actor.sub,
        studentUserId: submission.studentUserId,
        status: 'ACTIVE',
        validFrom: { $lte: now() },
        $or: [{ validTo: null }, { validTo: { $gte: now() } }],
      });
      if (linked) return submission;
    }
    if (actor?.role === 'ADMIN') return submission;
    throw new ApiError(403, 'You cannot access this submission');
  };

  const listStudentSubmissions = async ({ actor, limit = 50, cursor }) => {
    requireId(actor?.sub, 'authenticated user');
    if (actor.role !== 'STUDENT') throw new ApiError(403, 'This account cannot list student submissions');
    return listPage(models.Submission, { studentUserId: actor.sub }, { limit, cursor, sortField: 'submittedAt' });
  };

  const getAssignmentAttachment = async ({ actor, assignmentId, fileId }) => {
    requireId(fileId, 'fileId');
    const assignment = await requireAssignment(assignmentId);
    await requireStudentVisibleAssignment(actor, assignment);
    if (actor.role === 'STUDENT' || actor.role === 'PARENT') {
      if (assignment.status !== 'PUBLISHED') throw new ApiError(404, 'Assignment attachment not found');
    }
    const attachment = assignment.attachments.find((file) => String(file._id) === String(fileId));
    if (!attachment) throw new ApiError(404, 'Assignment attachment not found');
    return attachment;
  };

  const listTeacherAssignments = async ({ actor, filters = {} }) => {
    requireId(actor?.sub, 'authenticated user');
    const query = {};
    if (actor.role !== 'ADMIN') {
      const teachingAssignments = await models.TeacherAssignment.find({
        teacherUserId: actor.sub,
        status: 'ACTIVE',
        validFrom: { $lte: now() },
        $or: [{ validTo: null }, { validTo: { $gte: now() } }],
      }).select('academicSessionId classId sectionId subjectId').lean();
      if (teachingAssignments.length === 0) return [];
      query.$or = teachingAssignments.map(({ academicSessionId, classId, sectionId, subjectId }) => ({
        academicSessionId,
        classId,
        sectionId,
        subjectId,
      }));
    }
    if (filters.status) query.status = filters.status;
    if (filters.academicSessionId) query.academicSessionId = filters.academicSessionId;
    if (filters.subjectId) query.subjectId = filters.subjectId;
    return listPage(models.Assignment, query, filters);
  };

  const listAssignmentSubmissions = async ({ actor, assignmentId, limit = 50 }) => {
    const assignment = await requireAssignment(assignmentId);
    await requireAssignmentManager(actor, assignment);
    return listPage(models.Submission, { assignmentId: assignment._id }, { limit, sortField: 'submittedAt' });
  };

  const authorizeAttachmentUpload = async ({ actor, assignmentId }) => {
    const assignment = await requireAssignment(assignmentId);
    await requireAssignmentManager(actor, assignment);
    if (assignment.status !== 'DRAFT') throw new ApiError(409, 'Attachments can only be changed on draft assignments');
    if (assignment.attachments.length >= 5) throw new ApiError(409, 'Assignment attachment limit reached');
  };

  const uploadAttachment = async ({ actor, assignmentId, file }) => {
    const assignment = await requireAssignment(assignmentId);
    await requireAssignmentManager(actor, assignment);
    if (assignment.status !== 'DRAFT') throw new ApiError(409, 'Attachments can only be changed on draft assignments');
    if (assignment.attachments.length >= 5) throw new ApiError(409, 'Assignment attachment limit reached');
    const policy = await getUploadPolicy();
    if (!file) throw new ApiError(400, 'An assignment attachment is required', { code: 'FILE_REQUIRED' });
    if (file.sizeBytes > policy.attachmentMaxBytes) {
      throw new ApiError(413, 'Attachment exceeds the configured upload limit', { code: 'UPLOAD_LIMIT_EXCEEDED' });
    }
    const storedFile = await storage.upload(file, 'attachment');
    try {
      const updated = await models.Assignment.findOneAndUpdate({
        _id: assignment._id,
        status: 'DRAFT',
        $expr: { $lt: [{ $size: '$attachments' }, 5] },
      }, { $push: { attachments: storedFile } }, { new: true, runValidators: true }).lean();
      if (!updated) throw new ApiError(409, 'Assignment changed or attachment limit was reached');
      return updated;
    } catch (error) {
      await cleanupFile(storedFile.publicId);
      throw error;
    }
  };

  const getAssignmentForTeacher = async ({ actor, assignmentId }) => {
    const assignment = await requireAssignment(assignmentId);
    await requireAssignmentManager(actor, assignment);
    return assignment;
  };

  const canAccessSubmissionFile = async ({ actor, submissionId }) => getSubmission({ actor, submissionId });

  return {
    getUploadPolicy,
    createAssignment,
    updateAssignment,
    publishAssignment,
    closeAssignment,
    extendDeadline,
    updateUploadLimits,
    uploadAttachment,
    authorizeAttachmentUpload,
    authorizeSubmissionUpload,
    authorizeReplacement,
    submitFile,
    replaceSubmissionFile,
    listStudentAssignments,
    getStudentAssignment,
    listTeacherAssignments,
    getAssignmentForTeacher,
    listAssignmentSubmissions,
    listStudentSubmissions,
    getSubmission,
    getAssignmentAttachment,
    canAccessSubmissionFile,
  };
};

module.exports = {
  ...createAssignmentService(),
  createAssignmentService,
  DEFAULT_UPLOAD_POLICY,
  HARD_UPLOAD_LIMIT_BYTES,
};