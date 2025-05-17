const express = require("express");
const childController = require("./children.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { childrenIdRules, childrenRules } = require("./children.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const childrenRoutes = express.Router();

childrenRoutes
  .get("/", isAuthorize("client master file", "create"), childController.getChildren)
  .get("/:id", isAuthorize("client master file", "create"), childrenIdRules, validateData, childController.getChild)
  .post("/", isAuthorize("client master file", "create"), childrenRules, validateData, childController.createChild)
  .put("/:id", isAuthorize("client master file", "create"), childrenIdRules, childrenRules, validateData, childController.updateChild)
  .delete("/:id", isAuthorize("client master file", "create"), childrenIdRules, validateData, childController.deleteChild);

module.exports = childrenRoutes;
