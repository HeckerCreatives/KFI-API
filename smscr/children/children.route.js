const express = require("express");
const childController = require("./children.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { childrenIdRules, childrenRules } = require("./children.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const childrenRoutes = express.Router();

childrenRoutes
  .get("/", isAuthorize("master client file", "update"), childController.getChildren)
  .get("/:id", isAuthorize("master client file", "update"), childrenIdRules, validateData, childController.getChild)
  .post("/", isAuthorize("master client file", "update"), childrenRules, validateData, childController.createChild)
  .put("/:id", isAuthorize("master client file", "update"), childrenIdRules, childrenRules, validateData, childController.updateChild)
  .delete("/:id", isAuthorize("master client file", "update"), childrenIdRules, validateData, childController.deleteChild);

module.exports = childrenRoutes;
