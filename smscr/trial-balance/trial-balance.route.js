const express = require("express");
const tbCtrl = require("./trial-balance.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { isAuthorize } = require("../../middlewares/authorized.js");
const { trialBalanceRules, trialBalanceIdRules, trialBalanceEntriesRules } = require("./trial-balance.validation.js");

const trialBalanceRoutes = express.Router();

trialBalanceRoutes
  .get("/", tbCtrl.getTrialBalances)
  .post("/", trialBalanceRules, validateData, tbCtrl.createTrialBalance)
  .put("/:id", trialBalanceIdRules, trialBalanceRules, validateData, tbCtrl.updateTrialBalance)
  .delete("/:id", trialBalanceIdRules, validateData, tbCtrl.deleteTrialBalance)
  .get("/entry/:id", trialBalanceIdRules, validateData, tbCtrl.getAllTrialBalanceEntriesNoPagination)
  .post("/entry/:id", trialBalanceIdRules, trialBalanceEntriesRules, validateData, tbCtrl.createTrialBalanceEntries)
  .put("/entry/:id", trialBalanceIdRules, trialBalanceEntriesRules, validateData, tbCtrl.updateTrialBalanceEntries);

module.exports = trialBalanceRoutes;
