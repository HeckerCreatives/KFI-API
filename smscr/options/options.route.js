const express = require("express");
const groupAcctController = require("../group-account/group-account.controller");
const centerController = require("../center/center.controller");
const businessTypeController = require("../business-type/business-type.controller");
const loanController = require("../loan/loan.controller");

const optionRoutes = express.Router();

optionRoutes
  .get("/group-account", groupAcctController.getOptions)
  .get("/center", centerController.getOptions)
  .get("/business-type", businessTypeController.getOptions)
  .get("/loan", loanController.getOptions);

module.exports = optionRoutes;
