const express = require("express");
const groupAcctController = require("../group-account/group-account.controller");

const optionRoutes = express.Router();

optionRoutes.get("/group-account", groupAcctController.getOptions);

module.exports = optionRoutes;
