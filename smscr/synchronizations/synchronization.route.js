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

const syncRoutes = express.Router();

syncRoutes
  .get("/banks", syncCtrl.downloadBanks)
  .put("/upload/banks", banksUploadRules, validateData, syncCtrl.syncBanks)

  .get("/business-types", syncCtrl.downloadBusinessTypes)
  .put("/upload/business-types", businessTypesUploadRules, validateData, syncCtrl.syncBusinessTypes)

  .get("/centers", syncCtrl.downloadCenters)
  .put("/upload/centers", centersUploadRules, validateData, syncCtrl.syncCenters)

  .get("/chart-of-accounts", syncCtrl.downloadChartOfAccounts)
  .put("/upload/chart-of-accounts", chartAccountsUploadRules, validateData, syncCtrl.syncChartOfAccounts)

  .get("/clients", syncCtrl.downloadClients)

  .get("/loan-codes", syncCtrl.downloadLoanCodes)

  .get("/loan-products", syncCtrl.downloadLoanProducts)
  .put("/upload/loan-products", loanProductsUploadRules, validateData, syncCtrl.syncLoanProducts)

  .get("/natures", syncCtrl.downloadNatures)
  .put("/upload/natures", naturesUploadRules, validateData, syncCtrl.syncNatures)

  .get("/payment-schedules", syncCtrl.downloadPaymentSchedules)

  .get("/suppliers", syncCtrl.downloadSuppliers)
  .put("/upload/suppliers", suppliersUploadRules, validateData, syncCtrl.syncSuppliers)

  .get("/system-parameters", syncCtrl.downloadSystemParams)
  .put("/upload/system-parameters", uploadSignaturesRules, validateData, syncCtrl.syncSystemParams)

  .get("/weekly-savings", syncCtrl.downloadWeeklySavings)
  .put("/upload/weekly-savings", weeklySavingRules, validateData, syncCtrl.syncWeeklySavings)

  .get("/group-of-accounts", syncCtrl.downloadGroupOfAccounts)
  .put("/upload/group-of-accounts", groupAccountsUploadRules, validateData, syncCtrl.syncGroupOfAccounts)

  .get("/loan-releases", syncCtrl.downloadLoanReleasesWithEntries)
  .put("/upload/loan-releases", loanReleaseUploadRules, validateData, syncCtrl.syncLoanReleasesWithEntries)

  .get("/journal-vouchers", syncCtrl.downloadJournalVouchersWithEntries)
  .put("/upload/journal-vouchers", journalVouchersUploadRules, validateData, syncCtrl.syncJournalVouchersWithEntries)

  .get("/expense-vouchers", syncCtrl.downloadExpenseVouchersWithEntries)
  .put("/upload/expense-vouchers", expenseVouchersUploadRules, validateData, syncCtrl.syncExpenseVouchersWithEntries)

  .get("/official-receipts", syncCtrl.downloadOfficialReceiptsWithEntries)
  .put("/upload/official-receipts", officialReceiptsUploadRules, validateData, syncCtrl.syncOfficialReceiptsWithEntries)

  .get("/acknowledgement-receipts", syncCtrl.downloadAcknowledgementReceiptsWithEntries)
  .put("/upload/acknowledgement-receipts", acknowledgementReceiptUploadRules, validateData, syncCtrl.syncAcknowledgementReceiptsWithEntries)

  .get("/emergency-loans", syncCtrl.downloadEmergencyLoansWithEntries)
  .put("/upload/emergency-loans", emergencyLoansUploadRules, validateData, syncCtrl.syncEmergencyLoansWithEntries)

  .get("/damayan-funds", syncCtrl.downloadDamayanFundsWithEntries)
  .put("/upload/damayan-funds", damayanFundsUploadRules, validateData, syncCtrl.syncDamayanFundsWithEntries);

module.exports = syncRoutes;
