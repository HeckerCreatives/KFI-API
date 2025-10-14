const express = require("express");
const transactionCtrl = require("./transaction.controller.js");
const entryCtrl = require("./entries/entry.controller.js");

const { loadEntryRules, createTransactionRules, transactionIdRules, updateTransactionRules, entryLoadRules, printFileRules } = require("./transaction.validation.js");
const { validateData } = require("../../validation/validate-data.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const transactionRoutes = express.Router();

transactionRoutes
  .get("/print/by-document/detailed", isAuthorize("loan release", "print"), transactionCtrl.printAllDetailedByDocument)
  .get("/print/by-date/detailed", isAuthorize("loan release", "print"), transactionCtrl.printAllDetailedByDate)
  .get("/print/by-document/summary", isAuthorize("loan release", "print"), transactionCtrl.printAllSummaryByDocument)
  .get("/print/by-date/summary", isAuthorize("loan release", "print"), transactionCtrl.printAllSummaryByDate)

  .post("/print/by-bank", isAuthorize("loan release", "print"), transactionCtrl.printAllByBank)
  .post("/print/by-accounts/detailed", isAuthorize("loan release", "print"), transactionCtrl.printByAccountCodes)
  .post("/print/by-accounts/summary", isAuthorize("loan release", "print"), transactionCtrl.printByAccountCodeSummarized)

  .get("/print/file/:transaction", isAuthorize("loan release", "print"), printFileRules, validateData, transactionCtrl.printFile)
  .get("/print/file-format/:transaction", isAuthorize("loan release", "print"), printFileRules, validateData, transactionCtrl.print2ndFormatFile)
  .get("/export/file/:transaction", isAuthorize("loan release", "export"), printFileRules, validateData, transactionCtrl.exportFile)
  .get("/export/file-format/:transaction", isAuthorize("loan release", "export"), printFileRules, validateData, transactionCtrl.export2ndFormatFile)

  .get("/export/by-document/summary", isAuthorize("loan release", "export"), transactionCtrl.exportAllSummary)
  .get("/export/by-date/summary", isAuthorize("loan release", "export"), transactionCtrl.exportAllSummaryByDate)
  .get("/export/by-document/detailed", isAuthorize("loan release", "export"), transactionCtrl.exportAllDetailed)
  .get("/export/by-date/detailed", isAuthorize("loan release", "export"), transactionCtrl.exportAllDetailedByDate)

  .post("/export/by-bank", isAuthorize("loan release", "export"), transactionCtrl.exportAllByBank)
  .post("/export/by-accounts/detailed", isAuthorize("loan release", "export"), transactionCtrl.exportByAccountCodes)
  .post("/export/by-accounts/summary", isAuthorize("loan release", "export"), transactionCtrl.exportByAccountCodeSummarized)

  // .get("/print/detailed/:id", isAuthorize("loan release", "print"), transactionCtrl.printDetailedById)
  // .get("/print/summary/:id", isAuthorize("loan release", "print"), transactionCtrl.printSummaryById)
  // .get("/export/summary/:id", isAuthorize("loan release", "export"), transactionCtrl.exportSummaryById)
  // .get("/export/detailed/:id", isAuthorize("loan release", "export"), transactionCtrl.exportDetailedById)

  .get("/selection", transactionCtrl.getSelections)
  .get("/entries/selection", entryCtrl.getSelections)
  .get("/by-center/:id", transactionCtrl.getByCenter)
  .get("/due-dates/:id", transactionCtrl.getDueDatesById)

  .post("/load/entries", loadEntryRules, validateData, transactionCtrl.loadEntries)
  .post("/entries/load", entryLoadRules, validateData, entryCtrl.loadEntries)

  .get("/loan-release/entries/:id", isAuthorize("loan release", "visible"), entryCtrl.getEntries)
  .get("/loan-release/entries/all/:id", isAuthorize("loan release", "visible"), entryCtrl.getAllEntries)

  .get("/loan-release", isAuthorize("loan release", "visible"), transactionCtrl.getLoanReleases)
  .post("/loan-release", isAuthorize("loan release", "create"), createTransactionRules, validateData, transactionCtrl.createLoanRelease)
  .put("/loan-release/:id", isAuthorize("loan release", "update"), transactionIdRules, updateTransactionRules, validateData, transactionCtrl.updateLoanRelease)
  .delete("/loan-release/:id", isAuthorize("loan release", "delete"), transactionIdRules, validateData, transactionCtrl.deleteLoanRelease);

// .post("/loan-release/entries/:id", isAuthorize("loan release", "update"), transactionIdRules, entryRules, validateData, entryCtrl.createEntry)
// .put("/loan-release/entries/:id/:entryId", isAuthorize("loan release", "update"), transactionIdRules, entryIdRules, entryRules, validateData, entryCtrl.updateEntry)
// .delete("/loan-release/entries/:id/:entryId", isAuthorize("loan release", "update"), transactionIdRules, deleteEntryRules, entryIdRules, validateData, entryCtrl.deleteEntry)

module.exports = transactionRoutes;
