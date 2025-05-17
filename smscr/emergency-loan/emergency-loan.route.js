const express = require("express");
const emergencyLoanController = require("./emergency-loan.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { emergencyLoanIdRules, emergencyLoanRules } = require("./emergency-loan.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const emergencyLoanRoutes = express.Router();

emergencyLoanRoutes
  .get("/", isAuthorize("emergency loan", "visible"), emergencyLoanController.getEmergencyLoans)
  .get("/:id", isAuthorize("emergency loan", "read"), emergencyLoanIdRules, validateData, emergencyLoanController.getEmergencyLoan)
  .post("/", isAuthorize("emergency loan", "create"), emergencyLoanRules, validateData, emergencyLoanController.createEmergencyLoan)
  .put("/:id", isAuthorize("emergency loan", "update"), emergencyLoanIdRules, emergencyLoanRules, validateData, emergencyLoanController.updateEmergencyLoan)
  .delete("/:id", isAuthorize("emergency loan", "delete"), emergencyLoanIdRules, validateData, emergencyLoanController.deleteEmergencyLoan);

module.exports = emergencyLoanRoutes;
