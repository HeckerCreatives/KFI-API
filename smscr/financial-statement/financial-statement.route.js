const express = require("express");
const fsCtrl = require("./financial-statement.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { isAuthorize } = require("../../middlewares/authorized.js");
const { financialStatementRules, financialStatementIdRules, financialStatementEntriesRules } = require("./financial-statement.validation.js");

const financialStatementRoutes = express.Router();

financialStatementRoutes
  .get("/", fsCtrl.getFinancialStatements)
  .post("/", financialStatementRules, validateData, fsCtrl.createFinancialStatement)
  .put("/:id", financialStatementIdRules, financialStatementRules, validateData, fsCtrl.updateFinancialStatement)
  .delete("/:id", financialStatementIdRules, validateData, fsCtrl.deleteFinancialStatement)
  .get("/entry/:id", financialStatementIdRules, validateData, fsCtrl.getAllFinancialStatementEntriesNoPagination)
  // .post("/entry/:id", financialStatementIdRules, financialStatementEntriesRules, validateData, fsCtrl.createFinancialStatementEntries)
  .put("/report-definition/:id", financialStatementIdRules, financialStatementEntriesRules, validateData, fsCtrl.updateFinancialStatementEntries);

module.exports = financialStatementRoutes;
