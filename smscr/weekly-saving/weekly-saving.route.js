const express = require("express");
const weeklySavingController = require("./weekly-saving.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { weeklySavingIdRules, weeklySavingRules } = require("./weekly-saving.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const bankRoutes = express.Router();

bankRoutes
  .get("/print-all", weeklySavingController.printAll)
  .get("/export-all", weeklySavingController.exportAll)
  .get("/", isAuthorize("weekly savings", "visible"), weeklySavingController.getWeeklySavings)
  .get("/:id", isAuthorize("weekly savings", "read"), weeklySavingIdRules, validateData, weeklySavingController.getWeeklySaving)
  .post("/", isAuthorize("weekly savings", "create"), weeklySavingRules, validateData, weeklySavingController.createWeeklySaving)
  .put("/:id", isAuthorize("weekly savings", "update"), weeklySavingIdRules, weeklySavingRules, validateData, weeklySavingController.updateWeeklySaving)
  .delete("/:id", isAuthorize("weekly savings", "delete"), weeklySavingIdRules, validateData, weeklySavingController.deleteWeeklySaving);

module.exports = bankRoutes;
