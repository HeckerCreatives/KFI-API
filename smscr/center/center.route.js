const express = require("express");
const centerController = require("./center.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { centerIdRules, centerRules, updateCenterRules } = require("./center.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const centerRoutes = express.Router();

centerRoutes
  .get("/selection", centerController.getSelections)
  .get("/print-all", isAuthorize("center", "print"), centerController.printAll)
  .get("/export-all", isAuthorize("center", "export"), centerController.exportAll)
  .get("/", isAuthorize("center", "visible"), centerController.getCenters)
  .get("/:id", isAuthorize("center", "read"), centerIdRules, validateData, centerController.getCenter)
  .get("/description/:id", centerIdRules, centerController.getDescription)
  .post("/", isAuthorize("center", "create"), centerRules, validateData, centerController.createCenter)
  .put("/:id", isAuthorize("center", "update"), centerIdRules, updateCenterRules, validateData, centerController.updateCenter)
  .delete("/:id", isAuthorize("center", "delete"), centerIdRules, validateData, centerController.deleteCenter);

module.exports = centerRoutes;
