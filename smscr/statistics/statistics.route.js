const express = require("express");
const statController = require("./statistics.controller.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const statsRoutes = express.Router();

statsRoutes
  .get("/cards", isAuthorize("dashboard", "visible"), statController.getDashboardCardStatistics)
  .get("/recent-members", isAuthorize("dashboard", "visible"), statController.getRecentMembers)
  .get("/recent-loans", isAuthorize("dashboard", "visible"), statController.getRecentLoans)
  .get("/loans-per-center", isAuthorize("dashboard", "visible"), statController.getLoansPerCenter);

module.exports = statsRoutes;
