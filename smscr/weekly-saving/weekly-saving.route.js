const express = require("express");
const weeklySavingController = require("./weekly-saving.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { weeklySavingIdRules, weeklySavingRules } = require("./weekly-saving.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const bankRoutes = express.Router();

bankRoutes
  .get("/print-all", weeklySavingController.printAll)
  .get("/export-all", weeklySavingController.exportAll)
  .get("/", isAuthorize("weekly saving table", "visible"), weeklySavingController.getWeeklySavings)
  .get("/:id", isAuthorize("weekly saving table", "read"), weeklySavingIdRules, validateData, weeklySavingController.getWeeklySaving)
  .post("/", isAuthorize("weekly saving table", "create"), weeklySavingRules, validateData, weeklySavingController.createWeeklySaving)
  .put("/:id", isAuthorize("weekly saving table", "update"), weeklySavingIdRules, weeklySavingRules, validateData, weeklySavingController.updateWeeklySaving)
  .delete("/:id", isAuthorize("weekly saving table", "delete"), weeklySavingIdRules, validateData, weeklySavingController.deleteWeeklySaving);

module.exports = bankRoutes;
