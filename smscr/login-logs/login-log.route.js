const express = require("express");
const loginLogCtrl = require("./login-log.controller.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const loginLogRoutes = express.Router();

loginLogRoutes.get("/", isAuthorize("login logs", "visible"), loginLogCtrl.getLogs);

module.exports = loginLogRoutes;
