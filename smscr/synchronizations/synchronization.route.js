const express = require("express");
const syncCtrl = require("./synchronization.controller.js");
const { banksUploadRules } = require("./validations/sync.banks.validation.js");
const { validateData } = require("../../validation/validate-data.js");
const { businessTypesUploadRules } = require("./validations/sync.business-types.validation.js");
const { weeklySavingRules } = require("./validations/sync.weekly-savings.validation.js");
const { centersUploadRules } = require("./validations/sync.centers.validation.js");
const { groupAccountsUploadRules } = require("./validations/sync.group-of-accounts.validation.js");
const { chartAccountsUploadRules } = require("./validations/sync.chart-of-accounts.validation.js");
const { suppliersUploadRules } = require("./validations/sync.suppliers.validation.js");
const { naturesUploadRules } = require("./validations/sync.natures.validation.js");
const { uploadSignaturesRules } = require("./validations/sync.signatures.validation.js");
const { loanProductsUploadRules } = require("./validations/sync.loan-products.validation.js");
const { loanReleaseUploadRules } = require("./validations/sync.loan-release.validation.js");
const { journalVouchersUploadRules } = require("./validations/sync.journal-voucher.validation.js");
const { expenseVouchersUploadRules } = require("./validations/sync.expense-voucher.validation.js");
const { officialReceiptsUploadRules } = require("./validations/sync.official-receipt.validation.js");
const { acknowledgementReceiptUploadRules } = require("./validations/sync.acknowledgement-receipt.validation.js");
const { emergencyLoansUploadRules } = require("./validations/sync.emergency-loan.validation.js");
const { damayanFundsUploadRules } = require("./validations/sync.damayan-fund.validation.js");
const syncClientUploadCheck = require("./file-uploads/sync.customer.upload.js");
const { clientUploadRules } = require("./validations/sync.clients.validation.js");
const { parseClientFormData } = require("./middleware/sync.clients.middleware.js");
const { isAuthorize } = require("../../middlewares/authorized.js");
const { isSyncAuthorize } = require("../../utils/have-permission.js");

const syncRoutes = express.Router();

syncRoutes
  .get("/banks", isAuthorize("bank", "visible"), syncCtrl.downloadBanks)
  .put("/upload/banks", isAuthorize("bank", "visible"), isSyncAuthorize("bank", "banks"), banksUploadRules, validateData, syncCtrl.syncBanks)

  .get("/business-types", isAuthorize("business type", "visible"), syncCtrl.downloadBusinessTypes)
  .put(
    "/upload/business-types",
    isAuthorize("business type", "visible"),
    isSyncAuthorize("business type", "businessTypes"),
    businessTypesUploadRules,
    validateData,
    syncCtrl.syncBusinessTypes
  )

  .get("/centers", isAuthorize("center", "visible"), syncCtrl.downloadCenters)
  .put("/upload/centers", isAuthorize("center", "visible"), isSyncAuthorize("center", "centers"), centersUploadRules, validateData, syncCtrl.syncCenters)

  .get("/chart-of-accounts", isAuthorize("chart of account", "visible"), syncCtrl.downloadChartOfAccounts)
  .put(
    "/upload/chart-of-accounts",
    isAuthorize("chart of account", "visible"),
    isSyncAuthorize("chart of account", "chartAccounts"),
    chartAccountsUploadRules,
    validateData,
    syncCtrl.syncChartOfAccounts
  )

  .get("/clients", isAuthorize("clients", "visible"), syncCtrl.downloadClients)
  .put(
    "/upload/clients",
    syncClientUploadCheck,
    isAuthorize("clients", "visible"),
    isSyncAuthorize("clients", "clients"),
    parseClientFormData,
    clientUploadRules,
    validateData,
    syncCtrl.syncClients
  )

  // .get("/loan-codes", syncCtrl.downloadLoanCodes)
  // .get("/payment-schedules", syncCtrl.downloadPaymentSchedules)

  .get("/loan-products", isAuthorize("product", "visible"), syncCtrl.downloadLoanProducts)
  .put("/upload/loan-products", isAuthorize("product", "visible"), isSyncAuthorize("product", "products"), loanProductsUploadRules, validateData, syncCtrl.syncLoanProducts)

  .get("/natures", isAuthorize("nature", "visible"), syncCtrl.downloadNatures)
  .put("/upload/natures", isAuthorize("nature", "visible"), isSyncAuthorize("nature", "natures"), naturesUploadRules, validateData, syncCtrl.syncNatures)

  .get("/suppliers", isAuthorize("business supplier", "visible"), syncCtrl.downloadSuppliers)
  .put(
    "/upload/suppliers",
    isAuthorize("business supplier", "visible"),
    isSyncAuthorize("business supplier", "suppliers"),
    suppliersUploadRules,
    validateData,
    syncCtrl.syncSuppliers
  )

  .get("/system-parameters", isAuthorize("parameters", "visible"), syncCtrl.downloadSystemParams)
  .put(
    "/upload/system-parameters",
    isAuthorize("parameters", "visible"),
    isSyncAuthorize("parameters", "signatures"),
    uploadSignaturesRules,
    validateData,
    syncCtrl.syncSystemParams
  )

  .get("/weekly-savings", isAuthorize("weekly savings", "visible"), syncCtrl.downloadWeeklySavings)
  .put(
    "/upload/weekly-savings",
    isAuthorize("weekly savings", "visible"),
    isSyncAuthorize("weekly savings", "weeklySavings"),
    weeklySavingRules,
    validateData,
    syncCtrl.syncWeeklySavings
  )

  .get("/group-of-accounts", isAuthorize("group of account", "visible"), syncCtrl.downloadGroupOfAccounts)
  .put(
    "/upload/group-of-accounts",
    isAuthorize("group of account", "visible"),
    isSyncAuthorize("group of account", "groupAccounts"),
    groupAccountsUploadRules,
    validateData,
    syncCtrl.syncGroupOfAccounts
  )

  .get("/loan-releases", isAuthorize("loan release", "visible"), syncCtrl.downloadLoanReleasesWithEntries)
  .put(
    "/upload/loan-releases",
    isAuthorize("loan release", "visible"),
    isSyncAuthorize("loan release", "loanReleases"),
    loanReleaseUploadRules,
    validateData,
    syncCtrl.syncLoanReleasesWithEntries
  )

  .get("/journal-vouchers", isAuthorize("journal voucher", "visible"), syncCtrl.downloadJournalVouchersWithEntries)
  .put(
    "/upload/journal-vouchers",
    isAuthorize("journal voucher", "visible"),
    isSyncAuthorize("journal voucher", "journalVouchers"),
    journalVouchersUploadRules,
    validateData,
    syncCtrl.syncJournalVouchersWithEntries
  )

  .get("/expense-vouchers", isAuthorize("expense voucher", "visible"), syncCtrl.downloadExpenseVouchersWithEntries)
  .put(
    "/upload/expense-vouchers",
    isAuthorize("expense voucher", "visible"),
    isSyncAuthorize("expense voucher", "expenseVouchers"),
    expenseVouchersUploadRules,
    validateData,
    syncCtrl.syncExpenseVouchersWithEntries
  )

  .get("/official-receipts", isAuthorize("acknowledgement", "visible"), syncCtrl.downloadOfficialReceiptsWithEntries)
  .put(
    "/upload/official-receipts",
    isAuthorize("acknowledgement", "visible"),
    isSyncAuthorize("acknowledgement", "officialReceipts"),
    officialReceiptsUploadRules,
    validateData,
    syncCtrl.syncOfficialReceiptsWithEntries
  )

  .get("/acknowledgement-receipts", isAuthorize("release", "visible"), syncCtrl.downloadAcknowledgementReceiptsWithEntries)
  .put(
    "/upload/acknowledgement-receipts",
    isAuthorize("release", "visible"),
    isSyncAuthorize("release", "acknowledgementReceipts"),
    acknowledgementReceiptUploadRules,
    validateData,
    syncCtrl.syncAcknowledgementReceiptsWithEntries
  )

  .get("/emergency-loans", isAuthorize("emergency loan", "visible"), syncCtrl.downloadEmergencyLoansWithEntries)
  .put(
    "/upload/emergency-loans",
    isAuthorize("emergency loan", "visible"),
    isSyncAuthorize("emergency loan", "emergencyLoans"),
    emergencyLoansUploadRules,
    validateData,
    syncCtrl.syncEmergencyLoansWithEntries
  )

  .get("/damayan-funds", isAuthorize("damayan fund", "visible"), syncCtrl.downloadDamayanFundsWithEntries)
  .put(
    "/upload/damayan-funds",
    isAuthorize("damayan fund", "visible"),
    isSyncAuthorize("damayan fund", "damayanFunds"),
    damayanFundsUploadRules,
    validateData,
    syncCtrl.syncDamayanFundsWithEntries
  );

module.exports = syncRoutes;
