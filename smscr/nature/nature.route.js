const express = require("express");
const natureController = require("./nature.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { natureIdRules, natureRules } = require("./nature.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const natureRoutes = express.Router();

natureRoutes
  .get("/", isAuthorize("nature", "visible"), natureController.getNatures)
  .get("/:id", isAuthorize("nature", "view"), natureIdRules, validateData, natureController.getNature)
  .post("/", isAuthorize("nature", "create"), natureRules, validateData, natureController.createNature)
  .put("/:id", isAuthorize("nature", "update"), natureIdRules, natureRules, validateData, natureController.updateNature)
  .delete("/:id", isAuthorize("nature", "delete"), natureIdRules, validateData, natureController.deleteNature);

module.exports = natureRoutes;
