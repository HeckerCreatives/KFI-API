const CustomError = require("../../utils/custom-error.js");
const { isValidDate } = require("../../utils/date.js");
const { getToken } = require("../../utils/get-token.js");
const { isValidSyncDates, validateSyncDates } = require("../../utils/validate-sync-dates.js");
const syncService = require("./synchronization.service.js");

exports.downloadBanks = async (req, res, next) => {
  try {
    const result = await syncService.download_banks();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.syncBanks = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await syncService.sync_banks(req.body.banks, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.downloadBusinessTypes = async (req, res, next) => {
  try {
    const result = await syncService.download_business_types();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.syncBusinessTypes = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await syncService.sync_business_types(req.body.businessTypes, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.downloadCenters = async (req, res, next) => {
  try {
    const result = await syncService.download_centers();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.syncCenters = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await syncService.sync_centers(req.body.centers, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.downloadChartOfAccounts = async (req, res, next) => {
  try {
    const result = await syncService.download_chart_of_accounts();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.syncChartOfAccounts = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await syncService.sync_chart_of_accounts(req.body.chartAccounts, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.downloadClients = async (req, res, next) => {
  try {
    const result = await syncService.download_clients();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.syncClients = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await syncService.sync_clients(req.body.clients, req.files, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.downloadLoanProducts = async (req, res, next) => {
  try {
    const result = await syncService.download_loan_products();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.syncLoanProducts = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await syncService.sync_loan_products(req.body.products, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.downloadLoanCodes = async (req, res, next) => {
  try {
    const result = await syncService.download_loan_codes();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.downloadNatures = async (req, res, next) => {
  try {
    const result = await syncService.download_natures();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.syncNatures = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await syncService.sync_natures(req.body.natures, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.downloadPaymentSchedules = async (req, res, next) => {
  try {
    const result = await syncService.download_payment_schedules();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.downloadSuppliers = async (req, res, next) => {
  try {
    const result = await syncService.download_suppliers();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.syncSuppliers = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await syncService.sync_suppliers(req.body.suppliers, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.downloadSystemParams = async (req, res, next) => {
  try {
    const result = await syncService.download_system_params();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.syncSystemParams = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await syncService.sync_system_params(req.body.signatures, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.downloadWeeklySavings = async (req, res, next) => {
  try {
    const result = await syncService.download_weekly_savings();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.syncWeeklySavings = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await syncService.sync_weekly_savings(req.body.weeklySavings, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.downloadGroupOfAccounts = async (req, res, next) => {
  try {
    const result = await syncService.download_group_of_accounts();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.syncGroupOfAccounts = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await syncService.sync_group_of_accounts(req.body.groupAccounts, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// TRANSACTIONS STARTS

exports.downloadLoanReleasesWithEntries = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    validateSyncDates(dateFrom, dateTo);

    const result = await syncService.download_loan_release_with_entries(dateFrom, dateTo);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.syncLoanReleasesWithEntries = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await syncService.sync_loan_release_with_entries(req.body.loanReleases, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.downloadJournalVouchersWithEntries = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    validateSyncDates(dateFrom, dateTo);

    const result = await syncService.download_journal_voucher_with_entries(dateFrom, dateTo);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.syncJournalVouchersWithEntries = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await syncService.sync_journal_voucher_with_entries(req.body.journalVouchers, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.downloadExpenseVouchersWithEntries = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    validateSyncDates(dateFrom, dateTo);

    const result = await syncService.download_expense_voucher_with_entries(dateFrom, dateTo);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.syncExpenseVouchersWithEntries = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await syncService.sync_expense_voucher_with_entries(req.body.expenseVouchers, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.downloadOfficialReceiptsWithEntries = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    validateSyncDates(dateFrom, dateTo);

    const result = await syncService.download_official_receipt_with_entries(dateFrom, dateTo);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.syncOfficialReceiptsWithEntries = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await syncService.sync_official_receipt_with_entries(req.body.officialReceipts, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.downloadAcknowledgementReceiptsWithEntries = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    validateSyncDates(dateFrom, dateTo);

    const result = await syncService.download_acknowledgement_receipt_with_entries(dateFrom, dateTo);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.syncAcknowledgementReceiptsWithEntries = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await syncService.sync_acknowledgement_receipt_with_entries(req.body.acknowledgementReceipts, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.downloadEmergencyLoansWithEntries = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    validateSyncDates(dateFrom, dateTo);

    const result = await syncService.download_emergency_loan_with_entries(dateFrom, dateTo);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.syncEmergencyLoansWithEntries = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await syncService.sync_emergency_loan_with_entries(req.body.emergencyLoans, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.downloadDamayanFundsWithEntries = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    validateSyncDates(dateFrom, dateTo);

    const result = await syncService.download_damayan_fund_with_entries(dateFrom, dateTo);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.syncDamayanFundsWithEntries = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await syncService.sync_damayan_fund_with_entries(req.body.damayanFunds, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
