const express = require("express");
const groupAcctController = require("./group-account.controller.js");

const { validateData } = require("../../validation/validate-data.js");
const { groupAccountIdRules, groupAccountRules } = require("./group-account.validation.js");

const groupAccountRoutes = express.Router();

groupAccountRoutes
  .get("/", groupAcctController.getGroupAccounts)
  .get("/:id", groupAccountIdRules, validateData, groupAcctController.getGroupAccount)
  .post("/", groupAccountRules, validateData, groupAcctController.createGroupAccount)
  .put("/:id", groupAccountIdRules, groupAccountRules, validateData, groupAcctController.updateGroupAccount)
  .delete("/:id", groupAccountIdRules, validateData, groupAcctController.deleteGroupAccount);

module.exports = groupAccountRoutes;
