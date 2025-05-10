const express = require("express");
const childController = require("./children.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { childrenIdRules, childrenRules } = require("./children.validation.js");

const childrenRoutes = express.Router();

childrenRoutes
  .get("/", childController.getChildren)
  .get("/:id", childrenIdRules, validateData, childController.getChild)
  .post("/", childrenRules, validateData, childController.createChild)
  .put("/:id", childrenIdRules, childrenRules, validateData, childController.updateChild)
  .delete("/:id", childrenIdRules, validateData, childController.deleteChild);

module.exports = childrenRoutes;
