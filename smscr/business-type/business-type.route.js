const express = require("express");
const businessTypeController = require("./business-type.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { businessTypeIdRules, businessTypeRules } = require("./business-type.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const businessTypeRoutes = express.Router();

businessTypeRoutes
  .get("/", isAuthorize("business type", "visible"), businessTypeController.getBusinessTypes)
  .get("/:id", isAuthorize("business type", "read"), businessTypeIdRules, validateData, businessTypeController.getBusinessType)
  .post("/", isAuthorize("business type", "create"), businessTypeRules, validateData, businessTypeController.createBusinessType)
  .put("/:id", isAuthorize("business type", "update"), businessTypeIdRules, businessTypeRules, validateData, businessTypeController.updateBusinessType)
  .delete("/:id", isAuthorize("business type", "delete"), businessTypeIdRules, validateData, businessTypeController.deleteBusinessType);

module.exports = businessTypeRoutes;
