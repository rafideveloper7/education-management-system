const { ROLES } = require('../constants/roles.constants');

// Section 18: Fine-grained ownership and relationship checks for fee operations.
// These policy functions return true/false — they do NOT throw errors.
// The calling service is responsible for throwing ApiError on false.

// Can this user view this invoice?
const canViewInvoice = ({ user, invoice }) => {
  if (!user || !invoice) return false;
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.STUDENT) {
    return invoice.studentUserId.toString() === user.sub.toString();
  }
  return false;
};

// Can this parent view their child's invoice?
// Section 18.4: Parent access requires verified Guardian–Student relationship.
// The relationship must be checked by the service, not assumed from studentUserId alone.
const canParentViewStudentFees = ({ user, parentStudentRelationship }) => {
  if (!user || user.role !== ROLES.PARENT) return false;
  if (!parentStudentRelationship) return false;
  // Relationship must be active and belong to this parent.
  return (
    parentStudentRelationship.parentUserId.toString() === user.sub.toString()
    && parentStudentRelationship.status === 'ACTIVE'
  );
};

// Can this user initiate a payment?
// Only students (for their own invoices) and admins can initiate payments.
const canInitiatePayment = ({ user, invoice }) => {
  if (!user || !invoice) return false;
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.STUDENT) {
    return invoice.studentUserId.toString() === user.sub.toString();
  }
  return false;
};

// Can this user view this receipt?
const canViewReceipt = ({ user, receipt }) => {
  if (!user || !receipt) return false;
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.STUDENT) {
    return receipt.studentUserId.toString() === user.sub.toString();
  }
  return false;
};

module.exports = {
  canViewInvoice,
  canParentViewStudentFees,
  canInitiatePayment,
  canViewReceipt,
};
