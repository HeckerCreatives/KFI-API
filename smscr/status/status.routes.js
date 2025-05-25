const express = require("express");
const statusCtrl = require("./status.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { isAuthorize } = require("../../middlewares/authorized.js");
const { statusIdRules, statusRules, updateStatusRules } = require("./status.validation.js");

const statusRoutes = express.Router();

statusRoutes
  .get("/selection", statusCtrl.getSelections)
  .get("/", isAuthorize("status", "visible"), statusCtrl.getStatuses)
  .get("/:id", isAuthorize("status", "read"), statusIdRules, validateData, statusCtrl.getStatus)
  .post("/", isAuthorize("status", "create"), statusRules, validateData, statusCtrl.createStatus)
  .put("/:id", isAuthorize("status", "update"), statusIdRules, updateStatusRules, validateData, statusCtrl.updateStatus)
  .delete("/:id", isAuthorize("status", "delete"), statusIdRules, validateData, statusCtrl.deleteStatus);

module.exports = statusRoutes;
