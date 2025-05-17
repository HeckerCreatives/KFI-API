const express = require("express");
const beneficiaryController = require("./beneficiary.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { beneficiaryIdRules, beneficiaryRules } = require("./beneficiary.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const beneficiaryRoutes = express.Router();

beneficiaryRoutes
  .get("/", isAuthorize("master client file", "update"), beneficiaryController.getBeneficiaries)
  .get("/:id", isAuthorize("master client file", "update"), beneficiaryIdRules, validateData, beneficiaryController.getBeneficiary)
  .post("/", isAuthorize("master client file", "update"), beneficiaryRules, validateData, beneficiaryController.createBeneficiary)
  .put("/:id", isAuthorize("master client file", "update"), beneficiaryIdRules, beneficiaryRules, validateData, beneficiaryController.updateBeneficiary)
  .delete("/:id", isAuthorize("master client file", "update"), beneficiaryIdRules, validateData, beneficiaryController.deleteBeneficiary);

module.exports = beneficiaryRoutes;
