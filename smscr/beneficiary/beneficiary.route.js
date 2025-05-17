const express = require("express");
const beneficiaryController = require("./beneficiary.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { beneficiaryIdRules, beneficiaryRules } = require("./beneficiary.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const beneficiaryRoutes = express.Router();

beneficiaryRoutes
  .get("/", isAuthorize("client master file", "create"), beneficiaryController.getBeneficiaries)
  .get("/:id", isAuthorize("client master file", "create"), beneficiaryIdRules, validateData, beneficiaryController.getBeneficiary)
  .post("/", isAuthorize("client master file", "create"), beneficiaryRules, validateData, beneficiaryController.createBeneficiary)
  .put("/:id", isAuthorize("client master file", "create"), beneficiaryIdRules, beneficiaryRules, validateData, beneficiaryController.updateBeneficiary)
  .delete("/:id", isAuthorize("client master file", "create"), beneficiaryIdRules, validateData, beneficiaryController.deleteBeneficiary);

module.exports = beneficiaryRoutes;
