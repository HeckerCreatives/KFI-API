const express = require("express");
const childController = require("./children.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { childrenIdRules, childrenRules } = require("./children.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const childrenRoutes = express.Router();

childrenRoutes
  .get("/", isAuthorize("clients", "visible"), childController.getChildren)
  .get("/:id", isAuthorize("clients", "visible"), childrenIdRules, validateData, childController.getChild)
  .post("/", isAuthorize("clients", "update"), childrenRules, validateData, childController.createChild)
  .put("/:id", isAuthorize("clients", "update"), childrenIdRules, childrenRules, validateData, childController.updateChild)
  .delete("/:id", isAuthorize("clients", "update"), childrenIdRules, validateData, childController.deleteChild);

module.exports = childrenRoutes;
