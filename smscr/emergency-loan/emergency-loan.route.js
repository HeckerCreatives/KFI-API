const express = require("express");
const emergencyLoanController = require("./emergency-loan.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { emergencyLoanIdRules, emergencyLoanRules } = require("./emergency-loan.validation.js");

const emergencyLoanRoutes = express.Router();

emergencyLoanRoutes
  .get("/", emergencyLoanController.getEmergencyLoans)
  .get("/:id", emergencyLoanIdRules, validateData, emergencyLoanController.getEmergencyLoan)
  .post("/", emergencyLoanRules, validateData, emergencyLoanController.createEmergencyLoan)
  .put("/:id", emergencyLoanIdRules, emergencyLoanRules, validateData, emergencyLoanController.updateEmergencyLoan)
  .delete("/:id", emergencyLoanIdRules, validateData, emergencyLoanController.deleteEmergencyLoan);

module.exports = emergencyLoanRoutes;
