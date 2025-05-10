const express = require("express");
const natureController = require("./nature.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { natureIdRules, natureRules } = require("./nature.validation.js");

const natureRoutes = express.Router();

natureRoutes
  .get("/", natureController.getNatures)
  .get("/:id", natureIdRules, validateData, natureController.getNature)
  .post("/", natureRules, validateData, natureController.createNature)
  .put("/:id", natureIdRules, natureRules, validateData, natureController.updateNature)
  .delete("/:id", natureIdRules, validateData, natureController.deleteNature);

module.exports = natureRoutes;
