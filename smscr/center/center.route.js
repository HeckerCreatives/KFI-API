const express = require("express");
const centerController = require("./center.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { centerIdRules, centerRules } = require("./center.validation.js");

const centerRoutes = express.Router();

centerRoutes
  .get("/", centerController.getCenters)
  .get("/:id", centerIdRules, validateData, centerController.getCenter)
  .post("/", centerRules, validateData, centerController.createCenter)
  .put("/:id", centerIdRules, centerRules, validateData, centerController.updateCenter)
  .delete("/:id", centerIdRules, validateData, centerController.deleteCenter);

module.exports = centerRoutes;
