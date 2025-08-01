const express = require("express");
const statController = require("./statistics.controller.js");

const statsRoutes = express.Router();

statsRoutes
  .get("/cards", statController.getDashboardCardStatistics)
  .get("/recent-members", statController.getRecentMembers)
  .get("/recent-loans", statController.getRecentLoans)
  .get("/loans-per-center", statController.getLoansPerCenter);

module.exports = statsRoutes;
