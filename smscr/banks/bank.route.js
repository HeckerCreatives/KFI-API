const express = require("express");
const bankController = require("./bank.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { bankIdRules, bankRules, updateBankRules } = require("./bank.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const bankRoutes = express.Router();

bankRoutes
  .get("/selection", bankController.getSelections)
  .get("/", isAuthorize("bank", "visible"), bankController.getBanks)
  .get("/:id", isAuthorize("bank", "read"), bankIdRules, validateData, bankController.getBank)
  .post("/", isAuthorize("bank", "create"), bankRules, validateData, bankController.createBank)
  .put("/:id", isAuthorize("bank", "update"), bankIdRules, updateBankRules, validateData, bankController.updateBank)
  .delete("/:id", isAuthorize("bank", "delete"), bankIdRules, validateData, bankController.deleteBank);

module.exports = bankRoutes;
