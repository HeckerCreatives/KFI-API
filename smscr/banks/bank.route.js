const express = require("express");
const bankController = require("./bank.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { bankIdRules, bankRules, updateBankRules } = require("./bank.validation.js");

const bankRoutes = express.Router();

bankRoutes
  .get("/", bankController.getBanks)
  .get("/:id", bankIdRules, validateData, bankController.getBank)
  .post("/", bankRules, validateData, bankController.createBank)
  .put("/:id", bankIdRules, updateBankRules, validateData, bankController.updateBank)
  .delete("/:id", bankIdRules, validateData, bankController.deleteBank);

module.exports = bankRoutes;
