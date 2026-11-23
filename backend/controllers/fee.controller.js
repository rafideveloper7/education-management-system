// Fee & Finance Controller — Group 14
// Thin HTTP layer: reads req.validated, calls service, returns response.
// No business logic here — all rules live in services and policies.

const feeStructureService = require('../services/fee/feeStructure.service');
const studentFeeService = require('../services/fee/studentFee.service');
const invoiceService = require('../services/fee/invoice.service');
const paymentService = require('../services/fee/payment.service');
const receiptService = require('../services/fee/receipt.service');
const financialReportService = require('../services/fee/financialReport.service');

const sendOk = (res, data, status = 200) => {
  if (data && Array.isArray(data.items) && data.pagination) {
    return res.status(status).json({ success: true, data: data.items, pagination: data.pagination });
  }
  return res.status(status).json({ success: true, data });
};

const wrap = (handler) => async (req, res, next) => {
  try {
    await handler(req, res);
  } catch (error) {
    next(error);
  }
};

// ─── Fee Structure ─────────────────────────────────────────────────────────────

module.exports.createFeeStructure = wrap(async (req, res) => sendOk(
  res,
  await feeStructureService.createFeeStructure({ actor: req.user, payload: req.validated.body }),
  201,
));

module.exports.listFeeStructures = wrap(async (req, res) => sendOk(
  res,
  await feeStructureService.listFeeStructures({ actor: req.user, filters: req.validated.query }),
));

module.exports.getFeeStructure = wrap(async (req, res) => sendOk(
  res,
  await feeStructureService.getFeeStructureById({
    actor: req.user,
    structureId: req.validated.params.structureId,
  }),
));

module.exports.updateFeeStructure = wrap(async (req, res) => sendOk(
  res,
  await feeStructureService.updateFeeStructure({
    actor: req.user,
    structureId: req.validated.params.structureId,
    payload: req.validated.body,
  }),
));

// ─── Student Fee Assignment ────────────────────────────────────────────────────

module.exports.assignFee = wrap(async (req, res) => sendOk(
  res,
  await studentFeeService.assignFeeToStudent({ actor: req.user, payload: req.validated.body }),
  201,
));

module.exports.listMyFeeAssignments = wrap(async (req, res) => sendOk(
  res,
  await studentFeeService.listStudentFeeAssignments({
    actor: req.user,
    studentUserId: req.user.sub,
    filters: req.validated.query,
  }),
));

module.exports.listStudentFeeAssignments = wrap(async (req, res) => sendOk(
  res,
  await studentFeeService.listStudentFeeAssignments({
    actor: req.user,
    studentUserId: req.validated.params.studentUserId,
    filters: req.validated.query,
  }),
));

// ─── Invoice ───────────────────────────────────────────────────────────────────

module.exports.generateInvoice = wrap(async (req, res) => sendOk(
  res,
  await invoiceService.generateInvoice({ actor: req.user, payload: req.validated.body }),
  201,
));

module.exports.listMyInvoices = wrap(async (req, res) => sendOk(
  res,
  await invoiceService.listInvoices({
    actor: req.user,
    filters: req.validated.query,
  }),
));

module.exports.listInvoices = wrap(async (req, res) => sendOk(
  res,
  await invoiceService.listInvoices({
    actor: req.user,
    filters: req.validated.query,
    studentUserId: req.validated.query.studentUserId,
  }),
));

module.exports.getInvoice = wrap(async (req, res) => sendOk(
  res,
  await invoiceService.getInvoiceById({
    actor: req.user,
    invoiceId: req.validated.params.invoiceId,
  }),
));

// ─── Payment ───────────────────────────────────────────────────────────────────

module.exports.initiatePayment = wrap(async (req, res) => sendOk(
  res,
  await paymentService.initiatePayment({ actor: req.user, payload: req.validated.body }),
  201,
));

module.exports.getPayment = wrap(async (req, res) => sendOk(
  res,
  await paymentService.getPaymentById({
    actor: req.user,
    paymentId: req.validated.params.paymentId,
  }),
));

module.exports.listInvoicePayments = wrap(async (req, res) => sendOk(
  res,
  await paymentService.listPaymentsForInvoice({
    actor: req.user,
    invoiceId: req.validated.params.invoiceId,
    filters: req.validated.query,
  }),
));

module.exports.listReconciliationPayments = wrap(async (req, res) => sendOk(
  res,
  await paymentService.listReconciliationPayments({
    actor: req.user,
    filters: req.validated.query,
  }),
));

// ─── Webhook (no req.user — provider-authenticated) ────────────────────────────

module.exports.handleWebhook = wrap(async (req, res) => {
  const providerName = req.validated.params.provider.toUpperCase();
  const result = await paymentService.handleProviderWebhook({
    providerName,
    rawBody: req.body,
    headers: req.headers,
  });
  // Always return 200 to the provider — Section 11.3.
  return res.status(200).json({ success: true, ...result });
});

// ─── Discount ─────────────────────────────────────────────────────────────────

module.exports.applyDiscount = wrap(async (req, res) => sendOk(
  res,
  await studentFeeService.applyDiscount({ actor: req.user, payload: req.validated.body }),
  201,
));

// ─── Receipt ───────────────────────────────────────────────────────────────────

module.exports.getReceipt = wrap(async (req, res) => sendOk(
  res,
  await receiptService.getReceiptById({
    actor: req.user,
    receiptId: req.validated.params.receiptId,
  }),
));

module.exports.listMyReceipts = wrap(async (req, res) => sendOk(
  res,
  await receiptService.listReceiptsForStudent({
    actor: req.user,
    studentUserId: req.user.sub,
    filters: req.validated.query,
  }),
));

module.exports.listStudentReceipts = wrap(async (req, res) => sendOk(
  res,
  await receiptService.listReceiptsForStudent({
    actor: req.user,
    studentUserId: req.validated.params.studentUserId,
    filters: req.validated.query,
  }),
));

// ─── Reports ───────────────────────────────────────────────────────────────────

module.exports.getOutstandingFees = wrap(async (req, res) => sendOk(
  res,
  await financialReportService.getOutstandingFeesSummary({
    actor: req.user,
    filters: req.validated.query,
  }),
));

module.exports.getFinancialSummary = wrap(async (req, res) => sendOk(
  res,
  await financialReportService.getFinancialSummary({
    actor: req.user,
    filters: req.validated.query,
  }),
));
