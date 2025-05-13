const express = require("express");
const loanController = require("./loan.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { loanIdRules, loanRules, updateLoanRules } = require("./loan.validation.js");

const loanRoutes = express.Router();

loanRoutes
  .get("/", loanController.getLoans)
  .get("/:id", loanIdRules, validateData, loanController.getLoan)
  .post("/", loanRules, validateData, loanController.createLoan)
  .put("/:id", loanIdRules, updateLoanRules, validateData, loanController.updateLoan)
  .delete("/:id", loanIdRules, validateData, loanController.deleteLoan);

module.exports = loanRoutes;
