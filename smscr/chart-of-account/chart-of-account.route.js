const express = require("express");
const chartOfAcountController = require("./chart-of-account.controller.js");
const { chartOfAccountRules, chartOfAccountIdRules, updateChartOfAccountRules, linkGroupOfAccountRules } = require("./chart-of-account.validation");
const { validateData } = require("../../validation/validate-data.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const chartOfAccountRoutes = express.Router();

chartOfAccountRoutes
  .get("/selection", chartOfAcountController.getSelections)
  .get("/print-all", chartOfAcountController.printAll)
  .get("/export-all", chartOfAcountController.exportAll)
  .get("/", isAuthorize("chart of account", "visible"), chartOfAcountController.getChartOfAccounts)
  .get("/:id", isAuthorize("chart of account", "read"), chartOfAccountIdRules, validateData, chartOfAcountController.getChartOfAccount)
  // .post("/", isAuthorize("chart of account", "create"), chartOfAccountRules, validateData, chartOfAcountController.createChartOfAccount)
  // .put("/:id", isAuthorize("chart of account", "update"), chartOfAccountIdRules, updateChartOfAccountRules, validateData, chartOfAcountController.updateChartOfAccount)
  .patch("/link/:id", isAuthorize("chart of account", "update"), chartOfAccountIdRules, linkGroupOfAccountRules, validateData, chartOfAcountController.linkGroupOfAccount)
  .delete("/:id", isAuthorize("chart of account", "delete"), chartOfAccountIdRules, validateData, chartOfAcountController.deleteChartOfAccount);

module.exports = chartOfAccountRoutes;
