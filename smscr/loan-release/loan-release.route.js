const express = require("express");
const loanReleaseController = require("./loan-release.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { loanReleaseIdRules, loanReleaseRules } = require("./lon-release.validation.js");

const loanReleaseRoutes = express.Router();

loanReleaseRoutes
  .get("/", loanReleaseController.getLoanReleases)
  .get("/:id", loanReleaseIdRules, validateData, loanReleaseController.getLoanRelease)
  .post("/", loanReleaseRules, validateData, loanReleaseController.createLoanRelease)
  .put("/:id", loanReleaseIdRules, loanReleaseRules, validateData, loanReleaseController.updateLoanRelease)
  .delete("/:id", loanReleaseIdRules, validateData, loanReleaseController.deleteLoanRelease);

module.exports = loanReleaseRoutes;
