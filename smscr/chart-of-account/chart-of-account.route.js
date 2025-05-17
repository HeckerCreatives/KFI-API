const express = require("express");
const chartOfAcountController = require("./chart-of-account.controller.js");
const { chartOfAccountRules, chartOfAccountIdRules, updateChartOfAccountRules } = require("./chart-of-account.validation");
const { validateData } = require("../../validation/validate-data.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const chartOfAccountRoutes = express.Router();

chartOfAccountRoutes
  .get("/", isAuthorize("chart of account", "visible"), chartOfAcountController.getChartOfAccounts)
  .get("/:id", isAuthorize("chart of account", "read"), chartOfAccountIdRules, validateData, chartOfAcountController.getChartOfAccount)
  .post("/", isAuthorize("chart of account", "create"), chartOfAccountRules, validateData, chartOfAcountController.createChartOfAccount)
  .put("/:id", isAuthorize("chart of account", "update"), chartOfAccountIdRules, updateChartOfAccountRules, validateData, chartOfAcountController.updateChartOfAccount)
  .delete("/:id", isAuthorize("chart of account", "delete"), chartOfAccountIdRules, validateData, chartOfAcountController.deleteChartOfAccount);

module.exports = chartOfAccountRoutes;
