// Admission Onboarding Service
// Section 5.7-5.9: Student onboarding, parent linking, and academic enrollment

const AdmissionApplication = require('../../models/admission/AdmissionApplication');
const AdmissionHistory = require('../../models/admission/AdmissionHistory');
const User = require('../../models/user/User');
const StudentProfile = require('../../models/profile/StudentProfile');
const ParentProfile = require('../../models/profile/ParentProfile');
const ParentStudent = require('../../models/parent/ParentStudent');
const StudentEnrollment = require('../../models/student/StudentEnrollment');
const { ApiError } = require('../../utils/ApiError');
const { hashPassword } = require('../auth/password.service');

class AdmissionOnboardingService {
  // Onboard approved applicant as student
  async onboardStudent(applicationId, onboarderUserId, academicSessionId, classId, sectionId) {
    const application = await AdmissionApplication.findById(applicationId);
    if (!application) {
      throw new ApiError(404, 'Admission application not found');
    }

    if (application.status !== 'APPROVED') {
      throw new ApiError(400, 'Only approved applications can be onboarded');
    }

    if (application.onboardedStudentUserId) {
      throw new ApiError(400, 'Student has already been onboarded');
    }

    // Check if user already exists with same email
    let existingUser = await User.findOne({ email: application.applicantEmail.toLowerCase() });
    
    if (existingUser && existingUser.role !== 'PUBLIC_USER') {
      throw new ApiError(400, 'User with this email already exists with a different role');
    }

    let studentUser;
    let isNewUser = false;

    if (existingUser) {
      // Update existing PUBLIC_USER to STUDENT
      existingUser.role = 'STUDENT';
      existingUser.fullName = application.applicantFullName;
      existingUser.status = 'ACTIVE';
      await existingUser.save();
      studentUser = existingUser;
    } else {
      // Create new student user
      const tempPassword = this.generateTemporaryPassword();
      const passwordHash = await hashPassword(tempPassword);

      studentUser = new User({
        fullName: application.applicantFullName,
        email: application.applicantEmail.toLowerCase(),
        passwordHash,
        role: 'STUDENT',
        status: 'ACTIVE',
        phone: application.applicantPhone,
      });

      await studentUser.save();
      isNewUser = true;
    }

    // Create student profile
    const studentProfile = new StudentProfile({
      userId: studentUser._id,
      fullName: application.applicantFullName,
      dateOfBirth: application.applicantDateOfBirth,
      gender: application.applicantGender,
      admissionNo: this.generateAdmissionNumber(),
      address: application.applicantAddress,
      emergencyContact: application.applicantPhone,
    });

    await studentProfile.save();

    // Update application
    application.status = 'ONBOARDED';
    application.onboardedStudentUserId = studentUser._id;
    application.onboardedAt = new Date();
    await application.save();

    // Record history
    await AdmissionHistory.recordAction({
      admissionApplicationId: applicationId,
      actionType: 'STUDENT_ONBOARDED',
      actionDescription: 'Student onboarded successfully',
      actorUserId: onboarderUserId,
      actorRole: 'ADMIN',
      previousState: { status: 'APPROVED', onboardedStudentUserId: null },
      newState: { status: 'ONBOARDED', onboardedStudentUserId: studentUser._id },
    });

    return {
      studentUser,
      studentProfile,
      isNewUser,
      tempPassword: isNewUser ? tempPassword : null,
      application,
    };
  }

  // Link parent to student
  async linkParentToStudent(studentUserId, parentData, linkerUserId) {
    // Check if student exists and is STUDENT role
    const studentUser = await User.findById(studentUserId);
    if (!studentUser || studentUser.role !== 'STUDENT') {
      throw new ApiError(404, 'Student not found');
    }

    // Check if parent user exists
    let parentUser = await User.findOne({ email: parentData.email.toLowerCase() });
    let isNewParent = false;

    if (parentUser) {
      // Update existing user to PARENT role if needed
      if (parentUser.role !== 'PARENT') {
        parentUser.role = 'PARENT';
        await parentUser.save();
      }
    } else {
      // Create new parent user
      const tempPassword = this.generateTemporaryPassword();
      const passwordHash = await hashPassword(tempPassword);

      parentUser = new User({
        fullName: parentData.fullName,
        email: parentData.email.toLowerCase(),
        passwordHash,
        role: 'PARENT',
        status: 'ACTIVE',
        phone: parentData.phone,
      });

      await parentUser.save();
      isNewParent = true;
    }

    // Create or update parent profile
    let parentProfile = await ParentProfile.findOne({ userId: parentUser._id });
    if (!parentProfile) {
      parentProfile = new ParentProfile({
        userId: parentUser._id,
        fullName: parentData.fullName,
        phone: parentData.phone,
        address: parentData.address,
        occupation: parentData.occupation,
      });
      await parentProfile.save();
    }

    // Create parent-student relationship
    const parentStudent = new ParentStudent({
      parentUserId: parentUser._id,
      studentUserId: studentUser._id,
      relationshipType: parentData.relationshipType,
      status: 'ACTIVE',
      validFrom: new Date(),
      notes: parentData.notes || '',
    });

    await parentStudent.save();

    // Find related application if exists
    const application = await AdmissionApplication.findOne({
      applicantEmail: studentUser.email.toLowerCase(),
      onboardedStudentUserId: studentUser._id,
    });

    if (application) {
      await AdmissionHistory.recordAction({
        admissionApplicationId: application._id,
        actionType: 'PARENT_LINKED',
        actionDescription: `Parent linked to student: ${parentData.relationshipType}`,
        actorUserId: linkerUserId,
        actorRole: 'ADMIN',
        previousState: { parentLinked: false },
        newState: { parentLinked: true, parentUserId: parentUser._id },
      });
    }

    return {
      parentUser,
      parentProfile,
      parentStudent,
      isNewParent,
      tempPassword: isNewParent ? tempPassword : null,
    };
  }

  // Enroll student in academic session
  async enrollStudent(studentUserId, enrollmentData, enrollerUserId) {
    // Check if student exists
    const studentUser = await User.findById(studentUserId);
    if (!studentUser || studentUser.role !== 'STUDENT') {
      throw new ApiError(404, 'Student not found');
    }

    // Check for active enrollment in same academic session
    const existingEnrollment = await StudentEnrollment.findOne({
      studentUserId,
      academicSessionId: enrollmentData.academicSessionId,
      status: 'ACTIVE',
    });

    if (existingEnrollment) {
      throw new ApiError(400, 'Student is already enrolled in this academic session');
    }

    // Create enrollment
    const enrollment = new StudentEnrollment({
      studentUserId,
      academicSessionId: enrollmentData.academicSessionId,
      classId: enrollmentData.classId,
      sectionId: enrollmentData.sectionId,
      rollNumber: enrollmentData.rollNumber,
      status: 'ACTIVE',
      validFrom: new Date(),
    });

    await enrollment.save();

    // Find related application if exists
    const application = await AdmissionApplication.findOne({
      applicantEmail: studentUser.email.toLowerCase(),
      onboardedStudentUserId: studentUser._id,
    });

    if (application) {
      // Update application
      application.status = 'ENROLLED';
      application.enrolledAcademicSessionId = enrollmentData.academicSessionId;
      application.enrolledClassId = enrollmentData.classId;
      application.enrolledSectionId = enrollmentData.sectionId;
      application.enrolledAt = new Date();
      await application.save();

      await AdmissionHistory.recordAction({
        admissionApplicationId: application._id,
        actionType: 'ENROLLMENT_COMPLETED',
        actionDescription: 'Student enrolled in academic session',
        actorUserId: enrollerUserId,
        actorRole: 'ADMIN',
        previousState: { status: 'ONBOARDED', enrollment: null },
        newState: { 
          status: 'ENROLLED',
          academicSessionId: enrollmentData.academicSessionId,
          classId: enrollmentData.classId,
          sectionId: enrollmentData.sectionId,
        },
      });
    }

    return enrollment;
  }

  // Complete full admission workflow (onboard + link parent + enroll)
  async completeAdmissionWorkflow(applicationId, workflowData, adminUserId) {
    const application = await AdmissionApplication.findById(applicationId);
    if (!application) {
      throw new ApiError(404, 'Admission application not found');
    }

    if (application.status !== 'APPROVED') {
      throw new ApiError(400, 'Only approved applications can complete workflow');
    }

    const results = {};

    try {
      // 1. Onboard student
      const onboardingResult = await this.onboardStudent(
        applicationId,
        adminUserId,
        workflowData.academicSessionId,
        workflowData.classId,
        workflowData.sectionId
      );
      results.onboarding = onboardingResult;

      // 2. Link parents if provided
      if (workflowData.parents && workflowData.parents.length > 0) {
        results.parents = [];
        for (const parentData of workflowData.parents) {
          const parentResult = await this.linkParentToStudent(
            onboardingResult.studentUser._id,
            parentData,
            adminUserId
          );
          results.parents.push(parentResult);
        }
      }

      // 3. Enroll student
      const enrollmentResult = await this.enrollStudent(
        onboardingResult.studentUser._id,
        {
          academicSessionId: workflowData.academicSessionId,
          classId: workflowData.classId,
          sectionId: workflowData.sectionId,
          rollNumber: workflowData.rollNumber,
        },
        adminUserId
      );
      results.enrollment = enrollmentResult;

      return results;
    } catch (error) {
      // Rollback if needed
      // In production, would implement proper transaction rollback
      throw error;
    }
  }

  // Generate temporary password
  generateTemporaryPassword() {
    const length = 10;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  // Generate admission number
  generateAdmissionNumber() {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ADM${year}${month}${random}`;
  }

  // Get student onboarding status
  async getOnboardingStatus(studentUserId) {
    const studentUser = await User.findById(studentUserId);
    if (!studentUser || studentUser.role !== 'STUDENT') {
      throw new ApiError(404, 'Student not found');
    }

    const [studentProfile, parentRelations, enrollments] = await Promise.all([
      StudentProfile.findOne({ userId: studentUserId }),
      ParentStudent.find({ studentUserId, status: 'ACTIVE' }),
      StudentEnrollment.find({ studentUserId, status: 'ACTIVE' }),
    ]);

    const application = await AdmissionApplication.findOne({
      applicantEmail: studentUser.email.toLowerCase(),
      onboardedStudentUserId: studentUserId,
    });

    return {
      studentUser: {
        _id: studentUser._id,
        email: studentUser.email,
        fullName: studentUser.fullName,
        role: studentUser.role,
        status: studentUser.status,
      },
      studentProfile: studentProfile || null,
      parents: {
        count: parentRelations.length,
        relationships: parentRelations,
      },
      enrollments: {
        count: enrollments.length,
        active: enrollments.filter(e => e.status === 'ACTIVE'),
      },
      admissionApplication: application ? {
        _id: application._id,
        applicationReference: application.applicationReference,
        status: application.status,
      } : null,
      isComplete: studentProfile && parentRelations.length > 0 && enrollments.length > 0,
    };
  }
}

module.exports = new AdmissionOnboardingService();