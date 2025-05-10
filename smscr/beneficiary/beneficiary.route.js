const express = require("express");
const beneficiaryController = require("./beneficiary.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { beneficiaryIdRules, beneficiaryRules } = require("./beneficiary.validation.js");

const beneficiaryRoutes = express.Router();

beneficiaryRoutes
  .get("/", beneficiaryController.getBeneficiaries)
  .get("/:id", beneficiaryIdRules, validateData, beneficiaryController.getBeneficiary)
  .post("/", beneficiaryRules, validateData, beneficiaryController.createBeneficiary)
  .put("/:id", beneficiaryIdRules, beneficiaryRules, validateData, beneficiaryController.updateBeneficiary)
  .delete("/:id", beneficiaryIdRules, validateData, beneficiaryController.deleteBeneficiary);

module.exports = beneficiaryRoutes;
