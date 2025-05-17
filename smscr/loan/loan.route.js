const express = require("express");
const loanController = require("./loan.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { loanIdRules, loanRules, updateLoanRules } = require("./loan.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const loanRoutes = express.Router();

loanRoutes
  .get("/", isAuthorize("loans", "visible"), loanController.getLoans)
  .get("/:id", isAuthorize("loans", "read"), loanIdRules, validateData, loanController.getLoan)
  .post("/", isAuthorize("loans", "create"), loanRules, validateData, loanController.createLoan)
  .put("/:id", isAuthorize("loans", "update"), loanIdRules, updateLoanRules, validateData, loanController.updateLoan)
  .delete("/:id", isAuthorize("loans", "delete"), loanIdRules, validateData, loanController.deleteLoan);

module.exports = loanRoutes;
