const express = require("express");
const activityLogCtrl = require("./activity-log.controller.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const activityLogRoutes = express.Router();

activityLogRoutes.get("/", isAuthorize("action logs", "visible"), activityLogCtrl.getAll);

module.exports = activityLogRoutes;
