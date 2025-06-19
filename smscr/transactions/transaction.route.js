const express = require("express");
const transactionCtrl = require("./transaction.controller.js");
const entryCtrl = require("./entries/entry.controller.js");

const { loadEntryRules, createTransactionRules, transactionIdRules, updateTransactionRules } = require("./transaction.validation.js");
const { validateData } = require("../../validation/validate-data.js");
const { isAuthorize } = require("../../middlewares/authorized.js");
const { entryRules, entryIdRules } = require("./entries/entry.validation.js");

const transactionRoutes = express.Router();

transactionRoutes
  .post("/load/entries", loadEntryRules, validateData, transactionCtrl.loadEntries)
  .get("/loan-release/entries/:id", isAuthorize("loan release", "update"), entryCtrl.getEntries)
  .post("/loan-release/entries/:id", isAuthorize("loan release", "update"), transactionIdRules, entryRules, validateData, entryCtrl.createEntry)
  .put("/loan-release/entries/:id/:entryId", isAuthorize("loan release", "update"), transactionIdRules, entryIdRules, entryRules, validateData, entryCtrl.updateEntry)
  .delete("/loan-release/entries/:id/:entryId", isAuthorize("loan release", "update"), transactionIdRules, entryIdRules, validateData, entryCtrl.deleteEntry)
  .get("/loan-release", isAuthorize("loan release", "visible"), transactionCtrl.getLoanReleases)
  .post("/loan-release", isAuthorize("loan release", "create"), createTransactionRules, validateData, transactionCtrl.createLoanRelease)
  .put("/loan-release/:id", isAuthorize("loan release", "update"), transactionIdRules, updateTransactionRules, validateData, transactionCtrl.updateLoanRelease)
  .delete("/loan-release/:id", isAuthorize("loan release", "delete"), transactionIdRules, validateData, transactionCtrl.deleteLoanRelease);

module.exports = transactionRoutes;
