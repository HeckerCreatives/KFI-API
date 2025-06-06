const express = require("express");
const groupAcctController = require("./group-account.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { groupAccountIdRules, groupAccountRules, updateGroupAccountRules } = require("./group-account.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const groupAccountRoutes = express.Router();

groupAccountRoutes
  .get("/selection", groupAcctController.getSelections)
  .get("/", isAuthorize("group of account", "visible"), groupAcctController.getGroupAccounts)
  .get("/:id", isAuthorize("group of account", "read"), groupAccountIdRules, validateData, groupAcctController.getGroupAccount)
  .post("/", isAuthorize("group of account", "create"), groupAccountRules, validateData, groupAcctController.createGroupAccount)
  .put("/:id", isAuthorize("group of account", "update"), groupAccountIdRules, updateGroupAccountRules, validateData, groupAcctController.updateGroupAccount)
  .delete("/:id", isAuthorize("group of account", "delete"), groupAccountIdRules, validateData, groupAcctController.deleteGroupAccount);

module.exports = groupAccountRoutes;
