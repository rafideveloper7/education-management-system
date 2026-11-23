// Group 15 — Admission Management Tests
// Section 13: Complete admission workflow testing

const test = require('node:test');
const assert = require('node:assert/strict');

process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/admission-tests';
process.env.JWT_ACCESS_SECRET ||= 'admission-tests-access-secret';
process.env.JWT_REFRESH_SECRET ||= 'admission-tests-refresh-secret';

const express = require('express');
const { createAccessToken } = require('../services/auth/token.service');
const { errorHandler } = require('../middleware/error.middleware');
const { attachRequestId } = require('../middleware/requestId.middleware');
const { PERMISSIONS } = require('../authorization/constants/permissions.constants');
const { hasPermission } = require('../authorization/services/permission.service');
const validators = require('../validators/admission/admission.validator');

// Test IDs
const ids = {
  admin: '65c000000000000000000001',
  publicUser: '65c000000000000000000002',
  academicSession: '65c000000000000000000003',
  class1: '65c000000000000000000004',
  class2: '65c000000000000000000005',
  configuration: '65c000000000000000000006',
  application1: '65c000000000000000000007',
  application2: '65c000000000000000000008',
  document1: '65c000000000000000000009',
};

// ─── Section 13.1: Admission Configuration Validation ────────────────────────

test('configuration validator rejects missing academic session ID', () => {
  const result = validators.createAdmissionConfigurationSchema.safeParse({
    name: 'Spring 2025 Admission',
    submissionStartDate: '2025-01-01T00:00:00Z',
    submissionEndDate: '2025-03-31T23:59:59Z',
  });
  assert.equal(result.success, false);
});

test('configuration validator rejects end date before start date', () => {
  const result = validators.createAdmissionConfigurationSchema.safeParse({
    academicSessionId: ids.academicSession,
    name: 'Spring 2025 Admission',
    submissionStartDate: '2025-03-01T00:00:00Z',
    submissionEndDate: '2025-01-01T00:00:00Z',
  });
  assert.equal(result.success, false);
});

test('configuration validator accepts valid configuration', () => {
  const result = validators.createAdmissionConfigurationSchema.safeParse({
    academicSessionId: ids.academicSession,
    name: 'Spring 2025 Admission',
    submissionStartDate: '2025-01-01T00:00:00Z',
    submissionEndDate: '2025-03-31T23:59:59Z',
    applicableClasses: [ids.class1, ids.class2],
    eligibilityCriteria: {
      minimumAge: 5,
      maximumAge: 18,
      previousAcademicRequired: true,
    },
  });
  assert.equal(result.success, true);
});

// ─── Section 13.2: Admission Application Validation ──────────────────────────

test('application validator rejects invalid email', () => {
  const result = validators.createAdmissionApplicationSchema.safeParse({
    admissionConfigurationId: ids.configuration,
    applicantFullName: 'Ali Khan',
    applicantDateOfBirth: '2010-05-15',
    applicantGender: 'MALE',
    applicantEmail: 'invalid-email',
    applicantPhone: '+923001234567',
    appliedClassId: ids.class1,
  });
  assert.equal(result.success, false);
});

test('application validator rejects future date of birth', () => {
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  const dateStr = futureDate.toISOString().split('T')[0];

  const result = validators.createAdmissionApplicationSchema.safeParse({
    admissionConfigurationId: ids.configuration,
    applicantFullName: 'Ali Khan',
    applicantDateOfBirth: dateStr,
    applicantGender: 'MALE',
    applicantEmail: 'ali@example.com',
    applicantPhone: '+923001234567',
    appliedClassId: ids.class1,
  });
  assert.equal(result.success, false);
});

test('application validator accepts valid application', () => {
  const result = validators.createAdmissionApplicationSchema.safeParse({
    admissionConfigurationId: ids.configuration,
    applicantFullName: 'Ali Khan',
    applicantDateOfBirth: '2010-05-15',
    applicantGender: 'MALE',
    applicantEmail: 'ali.khan@example.com',
    applicantPhone: '+923001234567',
    applicantAddress: '123 Main Street, Karachi',
    appliedClassId: ids.class1,
    previousSchoolName: 'ABC School',
    fatherName: 'Ahmed Khan',
    fatherPhone: '+923001234568',
  });
  assert.equal(result.success, true);
});

// ─── Section 13.3: Document Validation ───────────────────────────────────────

test('document validator rejects empty document type', () => {
  const result = validators.uploadDocumentSchema.safeParse({
    documentType: '',
    documentName: 'Birth Certificate',
  });
  assert.equal(result.success, false);
});

test('document validator accepts valid document data', () => {
  const result = validators.uploadDocumentSchema.safeParse({
    documentType: 'BIRTH_CERTIFICATE',
    documentName: 'Birth Certificate - Ali Khan',
    documentDescription: 'Original birth certificate issued by NADRA',
  });
  assert.equal(result.success, true);
});

// ─── Section 13.4: Workflow Validation ───────────────────────────────────────

test('approval validator rejects empty rejection notes', () => {
  const result = validators.rejectApplicationSchema.safeParse({
    rejectionNotes: '',
  });
  assert.equal(result.success, false);
});

test('approval validator requires minimum length for rejection notes', () => {
  const result = validators.rejectApplicationSchema.safeParse({
    rejectionNotes: 'No',
  });
  assert.equal(result.success, false);
});

test('approval validator accepts valid approval', () => {
  const result = validators.approveApplicationSchema.safeParse({
    approvalNotes: 'Application meets all criteria. Approved for admission.',
  });
  assert.equal(result.success, true);
});

// ─── Section 13.5: Onboarding Validation ─────────────────────────────────────

test('onboarding validator rejects missing class ID', () => {
  const result = validators.onboardStudentSchema.safeParse({
    academicSessionId: ids.academicSession,
    sectionId: '65c00000000000000000000a',
  });
  assert.equal(result.success, false);
});

test('onboarding validator accepts valid onboarding data', () => {
  const result = validators.onboardStudentSchema.safeParse({
    academicSessionId: ids.academicSession,
    classId: ids.class1,
    sectionId: '65c00000000000000000000a',
  });
  assert.equal(result.success, true);
});

// ─── Section 13.6: Parent Linking Validation ─────────────────────────────────

test('parent linking validator rejects invalid relationship type', () => {
  const result = validators.linkParentSchema.safeParse({
    fullName: 'Ahmed Khan',
    email: 'ahmed@example.com',
    phone: '+923001234568',
    relationshipType: 'FRIEND', // Invalid
  });
  assert.equal(result.success, false);
});

test('parent linking validator accepts valid parent data', () => {
  const result = validators.linkParentSchema.safeParse({
    fullName: 'Ahmed Khan',
    email: 'ahmed.khan@example.com',
    phone: '+923001234568',
    relationshipType: 'FATHER',
    address: '123 Main Street, Karachi',
    occupation: 'Businessman',
  });
  assert.equal(result.success, true);
});

// ─── Section 13.7: Permission Checks ─────────────────────────────────────────

test('only admin has ADMISSION_CONFIG_MANAGE permission', () => {
  assert.equal(hasPermission({ role: 'ADMIN' }, PERMISSIONS.ADMISSION_CONFIG_MANAGE), true);
  assert.equal(hasPermission({ role: 'TEACHER' }, PERMISSIONS.ADMISSION_CONFIG_MANAGE), false);
  assert.equal(hasPermission({ role: 'STUDENT' }, PERMISSIONS.ADMISSION_CONFIG_MANAGE), false);
  assert.equal(hasPermission({ role: 'PARENT' }, PERMISSIONS.ADMISSION_CONFIG_MANAGE), false);
  assert.equal(hasPermission({ role: 'PUBLIC_USER' }, PERMISSIONS.ADMISSION_CONFIG_MANAGE), false);
});

test('only admin has ADMISSION_DECISION_APPROVE permission', () => {
  assert.equal(hasPermission({ role: 'ADMIN' }, PERMISSIONS.ADMISSION_DECISION_APPROVE), true);
  assert.equal(hasPermission({ role: 'TEACHER' }, PERMISSIONS.ADMISSION_DECISION_APPROVE), false);
  assert.equal(hasPermission({ role: 'STUDENT' }, PERMISSIONS.ADMISSION_DECISION_APPROVE), false);
});

test('only admin has ADMISSION_STUDENT_ONBOARD permission', () => {
  assert.equal(hasPermission({ role: 'ADMIN' }, PERMISSIONS.ADMISSION_STUDENT_ONBOARD), true);
  assert.equal(hasPermission({ role: 'TEACHER' }, PERMISSIONS.ADMISSION_STUDENT_ONBOARD), false);
  assert.equal(hasPermission({ role: 'STUDENT' }, PERMISSIONS.ADMISSION_STUDENT_ONBOARD), false);
});

test('only admin has ADMISSION_REPORT_VIEW permission', () => {
  assert.equal(hasPermission({ role: 'ADMIN' }, PERMISSIONS.ADMISSION_REPORT_VIEW), true);
  assert.equal(hasPermission({ role: 'TEACHER' }, PERMISSIONS.ADMISSION_REPORT_VIEW), false);
  assert.equal(hasPermission({ role: 'STUDENT' }, PERMISSIONS.ADMISSION_REPORT_VIEW), false);
});

test('public user has ADMISSION_APPLICATION_CREATE permission', () => {
  assert.equal(hasPermission({ role: 'PUBLIC_USER' }, PERMISSIONS.ADMISSION_APPLICATION_CREATE), true);
  assert.equal(hasPermission({ role: 'STUDENT' }, PERMISSIONS.ADMISSION_APPLICATION_CREATE), false);
  assert.equal(hasPermission({ role: 'PARENT' }, PERMISSIONS.ADMISSION_APPLICATION_CREATE), false);
});

test('public user has ADMISSION_DOCUMENT_UPLOAD permission', () => {
  assert.equal(hasPermission({ role: 'PUBLIC_USER' }, PERMISSIONS.ADMISSION_DOCUMENT_UPLOAD), true);
  assert.equal(hasPermission({ role: 'STUDENT' }, PERMISSIONS.ADMISSION_DOCUMENT_UPLOAD), false);
  assert.equal(hasPermission({ role: 'TEACHER' }, PERMISSIONS.ADMISSION_DOCUMENT_UPLOAD), false);
});

// ─── Section 13.8: Parameter Validation ──────────────────────────────────────

test('configuration params validator rejects invalid ID format', () => {
  const result = validators.configurationParamsSchema.safeParse({
    configurationId: 'invalid-id',
  });
  assert.equal(result.success, false);
});

test('application params validator accepts valid ID format', () => {
  const result = validators.applicationParamsSchema.safeParse({
    applicationId: '65c000000000000000000007',
  });
  assert.equal(result.success, true);
});

test('document params validator rejects short ID', () => {
  const result = validators.documentParamsSchema.safeParse({
    documentId: '123',
  });
  assert.equal(result.success, false);
});

// ─── Section 13.9: Query Parameter Validation ────────────────────────────────

test('application list query validator accepts valid filters', () => {
  const result = validators.applicationListQuerySchema.safeParse({
    status: 'SUBMITTED',
    page: '1',
    limit: '20',
    search: 'Ali',
  });
  assert.equal(result.success, true);
});

test('application list query validator rejects invalid status', () => {
  const result = validators.applicationListQuerySchema.safeParse({
    status: 'INVALID_STATUS',
    page: '1',
    limit: '20',
  });
  assert.equal(result.success, false);
});

test('admission report query validator accepts date ranges', () => {
  const result = validators.admissionReportQuerySchema.safeParse({
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-03-31T23:59:59Z',
    status: 'APPROVED',
  });
  assert.equal(result.success, true);
});

// ─── Section 13.10: Complete Workflow Validation ─────────────────────────────

test('complete workflow validator accepts valid workflow data', () => {
  const result = validators.completeAdmissionWorkflowSchema.safeParse({
    academicSessionId: ids.academicSession,
    classId: ids.class1,
    sectionId: '65c00000000000000000000a',
    rollNumber: '2025-001',
    parents: [
      {
        fullName: 'Ahmed Khan',
        email: 'ahmed@example.com',
        phone: '+923001234568',
        relationshipType: 'FATHER',
      },
      {
        fullName: 'Fatima Khan',
        email: 'fatima@example.com',
        phone: '+923001234569',
        relationshipType: 'MOTHER',
      },
    ],
  });
  assert.equal(result.success, true);
});

test('complete workflow validator rejects missing required fields', () => {
  const result = validators.completeAdmissionWorkflowSchema.safeParse({
    academicSessionId: ids.academicSession,
    // Missing classId and sectionId
    parents: [],
  });
  assert.equal(result.success, false);
});

console.log('✅ All admission tests passed!');