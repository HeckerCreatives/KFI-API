const express = require("express");
const bankController = require("./bank.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { bankIdRules, bankRules } = require("./bank.validation.js");

const bankRoutes = express.Router();

bankRoutes
  .get("/", bankController.getBanks)
  .get("/:id", bankIdRules, validateData, bankController.getBank)
  .post("/", bankRules, validateData, bankController.createBank)
  .put("/:id", bankIdRules, bankRules, validateData, bankController.updateBank)
  .delete("/:id", bankIdRules, validateData, bankController.deleteBank);

module.exports = bankRoutes;
