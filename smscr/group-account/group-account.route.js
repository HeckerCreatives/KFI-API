const express = require("express");
const groupAcctController = require("./group-account.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { groupAccountIdRules, groupAccountRules, updateGroupAccountRules } = require("./group-account.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const groupAccountRoutes = express.Router();

groupAccountRoutes
  .get("/selection", groupAcctController.getSelections)
  .get("/", isAuthorize("group account", "visible"), groupAcctController.getGroupAccounts)
  .get("/:id", isAuthorize("group account", "read"), groupAccountIdRules, validateData, groupAcctController.getGroupAccount)
  .post("/", isAuthorize("group account", "create"), groupAccountRules, validateData, groupAcctController.createGroupAccount)
  .put("/:id", isAuthorize("group account", "update"), groupAccountIdRules, updateGroupAccountRules, validateData, groupAcctController.updateGroupAccount)
  .delete("/:id", isAuthorize("group account", "delete"), groupAccountIdRules, validateData, groupAcctController.deleteGroupAccount);

module.exports = groupAccountRoutes;
