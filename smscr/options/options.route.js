const express = require("express");
const groupAcctController = require("../group-account/group-account.controller");
const centerController = require("../center/center.controller");
const businessTypeController = require("../business-type/business-type.controller");

const optionRoutes = express.Router();

optionRoutes.get("/group-account", groupAcctController.getOptions).get("/center", centerController.getOptions).get("/business-type", businessTypeController.getOptions);

module.exports = optionRoutes;
