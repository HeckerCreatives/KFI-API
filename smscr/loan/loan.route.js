const express = require("express");
const loanController = require("./loan.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { loanProductIdRules, loanProductRules, updateLoanProductRules, loanCodeRules, loanCodeIdRules } = require("./loan.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const loanRoutes = express.Router();

loanRoutes
  .get("/", isAuthorize("loans", "visible"), loanController.getLoans)
  .get("/:id", isAuthorize("loans", "read"), loanProductIdRules, validateData, loanController.getLoan)
  .post("/", isAuthorize("loans", "create"), loanProductRules, validateData, loanController.createLoan)
  .post("/code", isAuthorize("loans", "create"), loanCodeRules, validateData, loanController.createLoanCode)
  .put("/:id", isAuthorize("loans", "update"), loanProductIdRules, updateLoanProductRules, validateData, loanController.updateLoan)
  .put("/code/:id", isAuthorize("loans", "update"), loanCodeIdRules, loanCodeRules, validateData, loanController.updateLoanCode)
  .delete("/:id", isAuthorize("loans", "delete"), loanProductIdRules, validateData, loanController.deleteLoan)
  .delete("/code/:id", isAuthorize("loans", "update"), loanCodeIdRules, validateData, loanController.deleteLoanCode);

module.exports = loanRoutes;
