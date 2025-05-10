const express = require("express");
const weeklySavingTimeCtrl = require("./weekly-saving-time.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { weeklySavingTimeIdRules, weeklySavingTimeRules } = require("./weekly-saving-time.validation.js");

const weeklySavingTimeRoutes = express.Router();

weeklySavingTimeRoutes
  .get("/", weeklySavingTimeCtrl.getWeeklySavingTimes)
  .get("/:id", weeklySavingTimeIdRules, validateData, weeklySavingTimeCtrl.getWeeklySavingTime)
  .post("/", weeklySavingTimeRules, validateData, weeklySavingTimeCtrl.createWeeklySavingTime)
  .put("/:id", weeklySavingTimeIdRules, weeklySavingTimeRules, validateData, weeklySavingTimeCtrl.updateWeeklySavingTime)
  .delete("/:id", weeklySavingTimeIdRules, validateData, weeklySavingTimeCtrl.deleteWeeklySavingTime);

module.exports = weeklySavingTimeRoutes;
