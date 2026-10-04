const { z } = require('zod');

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'A valid ObjectId is required');
const optionalText = (max) => z.string().trim().max(max).optional();
const nullableDate = z.coerce.date().nullable().optional();
const nullableObjectId = objectIdSchema.nullable().optional();
const nullablePicture = z.string().trim().nullable().optional();

const profileFieldsByRole = {
  ADMIN: {
    designation: optionalText(100),
    departmentId: nullableObjectId,
  },
  TEACHER: {
    employeeId: optionalText(40),
    departmentId: nullableObjectId,
    designation: optionalText(100),
    qualification: optionalText(150),
    joiningDate: nullableDate,
  },
  STUDENT: {
    dateOfBirth: nullableDate,
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).nullable().optional(),
    bloodGroup: optionalText(10),
    admissionNo: optionalText(40),
    rollNo: optionalText(30),
    address: optionalText(500),
    emergencyContact: optionalText(30),
  },
  PARENT: {
    alternatePhone: optionalText(30),
    address: optionalText(500),
    occupation: optionalText(100),
  },
  PUBLIC_USER: {},
};

const createProfileSchemas = (role) => {
  const roleFields = profileFieldsByRole[role];
  if (!roleFields) return null;

  const fields = {
    fullName: z.string().trim().min(2, 'Full name is required').max(120),
    phone: optionalText(30),
    profilePicture: nullablePicture,
    ...roleFields,
  };
  const replacement = z.object(fields).strict();
  const patch = replacement.partial().refine((data) => Object.keys(data).length > 0, {
    message: 'At least one profile field is required',
  });

  return { replacement, patch };
};

module.exports = { createProfileSchemas };