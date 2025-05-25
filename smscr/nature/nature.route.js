const express = require("express");
const natureController = require("./nature.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { natureIdRules, natureRules } = require("./nature.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const natureRoutes = express.Router();

natureRoutes
  .get("/", isAuthorize("group account", "visible"), natureController.getNatures)
  .get("/:id", isAuthorize("group account", "view"), natureIdRules, validateData, natureController.getNature)
  .post("/", isAuthorize("group account", "create"), natureRules, validateData, natureController.createNature)
  .put("/:id", isAuthorize("group account", "update"), natureIdRules, natureRules, validateData, natureController.updateNature)
  .delete("/:id", isAuthorize("group account", "delete"), natureIdRules, validateData, natureController.deleteNature);

module.exports = natureRoutes;
