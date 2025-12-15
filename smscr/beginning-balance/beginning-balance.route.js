const express = require("express");
const beginningBalanceCtrl = require("./beginning-balance.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { isAuthorize } = require("../../middlewares/authorized.js");
const { beginningBalanceRules, beginningBalanceIdRules, beginningBalanceAccountCodeRules, beginningBalanceAccountCodeByYearRules } = require("./beginning-balance.validation.js");

const beginningBalanceRoutes = express.Router();

beginningBalanceRoutes
  .get("/account-codes", beginningBalanceAccountCodeRules, validateData, beginningBalanceCtrl.getEntriesByAccountCode)
  .get("/account-codes/:year", beginningBalanceAccountCodeByYearRules, beginningBalanceAccountCodeRules, validateData, beginningBalanceCtrl.generateEntriesFromOtherYear)
  .get("/print/by-year/:year", isAuthorize("beginning balance", "print"), beginningBalanceAccountCodeByYearRules, validateData, beginningBalanceCtrl.printBeginningBalanceByYear)
  .get("/export/by-year/:year", isAuthorize("beginning balance", "export"), beginningBalanceAccountCodeByYearRules, validateData, beginningBalanceCtrl.exportBeginningBalanceByYear)
  .get("/", isAuthorize("beginning balance", "visible"), beginningBalanceCtrl.getBeginningBalances)
  .get("/entries/:id", isAuthorize("beginning balance", "visible"), beginningBalanceIdRules, validateData, beginningBalanceCtrl.getBeginningBalanceEntries)
  .post("/", isAuthorize("beginning balance", "create"), beginningBalanceRules, validateData, beginningBalanceCtrl.createBeginningBalance)
  .put("/:id", isAuthorize("beginning balance", "update"), beginningBalanceIdRules, beginningBalanceRules, validateData, beginningBalanceCtrl.updateBeginningBalance)
  .delete("/:id", isAuthorize("beginning balance", "delete"), beginningBalanceIdRules, validateData, beginningBalanceCtrl.deleteBeginningBalance);

module.exports = beginningBalanceRoutes;
