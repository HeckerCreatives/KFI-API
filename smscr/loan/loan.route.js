const express = require("express");
const loanController = require("./loan.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { loanProductIdRules, loanProductRules, updateLoanProductRules, loanCodeRules, loanCodeIdRules } = require("./loan.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const loanRoutes = express.Router();

loanRoutes
  .get("/selection", loanController.getSelections)
  .get("/", isAuthorize("product", "visible"), loanController.getLoans)
  .get("/:id", isAuthorize("product", "read"), loanProductIdRules, validateData, loanController.getLoan)
  .post("/", isAuthorize("product", "create"), loanProductRules, validateData, loanController.createLoan)
  .post("/code", isAuthorize("product", "update"), loanCodeRules, validateData, loanController.createLoanCode)
  .put("/:id", isAuthorize("product", "update"), loanProductIdRules, updateLoanProductRules, validateData, loanController.updateLoan)
  .put("/code/:id", isAuthorize("product", "update"), loanCodeIdRules, loanCodeRules, validateData, loanController.updateLoanCode)
  .delete("/:id", isAuthorize("product", "delete"), loanProductIdRules, validateData, loanController.deleteLoan)
  .delete("/code/:id", isAuthorize("product", "update"), loanCodeIdRules, validateData, loanController.deleteLoanCode);

module.exports = loanRoutes;
