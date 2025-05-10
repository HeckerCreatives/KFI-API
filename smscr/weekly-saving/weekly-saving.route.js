const express = require("express");
const weeklySavingController = require("./weekly-saving.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { weeklySavingIdRules, weeklySavingRules } = require("./weekly-saving.validation.js");

const bankRoutes = express.Router();

bankRoutes
  .get("/", weeklySavingController.getWeeklySavings)
  .get("/:id", weeklySavingIdRules, validateData, weeklySavingController.getWeeklySaving)
  .post("/", weeklySavingRules, validateData, weeklySavingController.createWeeklySaving)
  .put("/:id", weeklySavingIdRules, weeklySavingRules, validateData, weeklySavingController.updateWeeklySaving)
  .delete("/:id", weeklySavingIdRules, validateData, weeklySavingController.deleteWeeklySaving);

module.exports = bankRoutes;
