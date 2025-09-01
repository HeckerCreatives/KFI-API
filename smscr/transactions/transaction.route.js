const express = require("express");
const transactionCtrl = require("./transaction.controller.js");
const entryCtrl = require("./entries/entry.controller.js");

const { loadEntryRules, createTransactionRules, transactionIdRules, updateTransactionRules, entryLoadRules, printFileRules } = require("./transaction.validation.js");
const { validateData } = require("../../validation/validate-data.js");
const { isAuthorize } = require("../../middlewares/authorized.js");
const { entryRules, entryIdRules, deleteEntryRules } = require("./entries/entry.validation.js");

const transactionRoutes = express.Router();

transactionRoutes
  .get("/print-all/detailed", isAuthorize("loan release", "print"), transactionCtrl.printAllDetailed)
  .get("/print/detailed/:id", isAuthorize("loan release", "print"), transactionCtrl.printDetailedById)
  .get("/print-all/summary", isAuthorize("loan release", "print"), transactionCtrl.printAllSummary)
  .get("/print/summary/:id", isAuthorize("loan release", "print"), transactionCtrl.printSummaryById)

  .get("/print/file/:transaction", isAuthorize("loan release", "print"), printFileRules, validateData, transactionCtrl.printFile)
  .get("/export/file/:transaction", isAuthorize("loan release", "export"), printFileRules, validateData, transactionCtrl.exportFile)

  .get("/export-all/summary", isAuthorize("loan release", "export"), transactionCtrl.exportAllSummary)
  .get("/export/summary/:id", isAuthorize("loan release", "export"), transactionCtrl.exportSummaryById)
  .get("/export-all/detailed", isAuthorize("loan release", "export"), transactionCtrl.exportAllDetailed)
  .get("/export/detailed/:id", isAuthorize("loan release", "export"), transactionCtrl.exportDetailedById)

  .get("/selection", transactionCtrl.getSelections)
  .get("/entries/selection", entryCtrl.getSelections)
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
