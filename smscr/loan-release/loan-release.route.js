const express = require("express");
const loanReleaseController = require("./loan-release.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { loanReleaseIdRules, loanReleaseRules } = require("./lon-release.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const loanReleaseRoutes = express.Router();

loanReleaseRoutes
  .get("/", isAuthorize("loan release", "visible"), loanReleaseController.getLoanReleases)
  .get("/:id", isAuthorize("loan release", "view"), loanReleaseIdRules, validateData, loanReleaseController.getLoanRelease)
  .post("/", isAuthorize("loan release", "create"), loanReleaseRules, validateData, loanReleaseController.createLoanRelease)
  .put("/:id", isAuthorize("loan release", "update"), loanReleaseIdRules, loanReleaseRules, validateData, loanReleaseController.updateLoanRelease)
  .delete("/:id", isAuthorize("loan release", "delete"), loanReleaseIdRules, validateData, loanReleaseController.deleteLoanRelease);

module.exports = loanReleaseRoutes;
