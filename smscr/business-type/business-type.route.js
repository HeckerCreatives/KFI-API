const express = require("express");
const businessTypeController = require("./business-type.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { businessTypeIdRules, businessTypeRules } = require("./business-type.validation.js");

const businessTypeRoutes = express.Router();

businessTypeRoutes
  .get("/", businessTypeController.getBusinessTypes)
  .get("/:id", businessTypeIdRules, validateData, businessTypeController.getBusinessType)
  .post("/", businessTypeRules, validateData, businessTypeController.createBusinessType)
  .put("/:id", businessTypeIdRules, businessTypeRules, validateData, businessTypeController.updateBusinessType)
  .delete("/:id", businessTypeIdRules, validateData, businessTypeController.deleteBusinessType);

module.exports = businessTypeRoutes;
