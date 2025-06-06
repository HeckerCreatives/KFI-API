const express = require("express");
const chartOfAcountController = require("./chart-of-account.controller.js");
const { chartOfAccountIdRules, linkGroupOfAccountRules } = require("./chart-of-account.validation");
const { validateData } = require("../../validation/validate-data.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const chartOfAccountRoutes = express.Router();

chartOfAccountRoutes
  .get("/selection", chartOfAcountController.getSelections)
  .get("/print-all", isAuthorize("chart of account", "print"), chartOfAcountController.printAll)
  .get("/export-all", isAuthorize("chart of account", "export"), chartOfAcountController.exportAll)
  .get("/", isAuthorize("chart of account", "visible"), chartOfAcountController.getChartOfAccounts)
  .get("/:id", isAuthorize("chart of account", "read"), chartOfAccountIdRules, validateData, chartOfAcountController.getChartOfAccount)
  .patch("/link/:id", isAuthorize("chart of account", "update"), chartOfAccountIdRules, linkGroupOfAccountRules, validateData, chartOfAcountController.linkGroupOfAccount);

module.exports = chartOfAccountRoutes;
