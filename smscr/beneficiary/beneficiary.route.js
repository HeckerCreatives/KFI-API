const express = require("express");
const beneficiaryController = require("./beneficiary.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { beneficiaryIdRules, beneficiaryRules } = require("./beneficiary.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const beneficiaryRoutes = express.Router();

beneficiaryRoutes
  .get("/", isAuthorize("clients", "visible"), beneficiaryController.getBeneficiaries)
  .get("/:id", isAuthorize("clients", "visible"), beneficiaryIdRules, validateData, beneficiaryController.getBeneficiary)
  .post("/", isAuthorize("clients", "update"), beneficiaryRules, validateData, beneficiaryController.createBeneficiary)
  .put("/:id", isAuthorize("clients", "update"), beneficiaryIdRules, beneficiaryRules, validateData, beneficiaryController.updateBeneficiary)
  .delete("/:id", isAuthorize("clients", "update"), beneficiaryIdRules, validateData, beneficiaryController.deleteBeneficiary);

module.exports = beneficiaryRoutes;
