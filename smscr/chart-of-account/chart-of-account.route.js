const express = require("express");
const chartOfAcountController = require("./chart-of-account.controller.js");
const { chartOfAccountRules, chartOfAccountIdRules, updateChartOfAccountRules } = require("./chart-of-account.validation");
const { validateData } = require("../../validation/validate-data.js");

const chartOfAccountRoutes = express.Router();

chartOfAccountRoutes
  .get("/", chartOfAcountController.getChartOfAccounts)
  .get("/:id", chartOfAccountIdRules, validateData, chartOfAcountController.getChartOfAccount)
  .post("/", chartOfAccountRules, validateData, chartOfAcountController.createChartOfAccount)
  .put("/:id", chartOfAccountIdRules, updateChartOfAccountRules, validateData, chartOfAcountController.updateChartOfAccount)
  .delete("/:id", chartOfAccountIdRules, validateData, chartOfAcountController.deleteChartOfAccount);

module.exports = chartOfAccountRoutes;
