const express = require("express");
const damayanFundController = require("./damayan-fund.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { damayanFundIdRules, damayanFundRules } = require("./damayan-fund.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const damayanFundRoutes = express.Router();

damayanFundRoutes
  .get("/", isAuthorize("damayan fund", "visible"), damayanFundController.getDamayanFunds)
  .get("/:id", isAuthorize("damayan fun", "read"), damayanFundIdRules, validateData, damayanFundController.getDamayanFund)
  .post("/", isAuthorize("damayan fun", "create"), damayanFundRules, validateData, damayanFundController.createDamayanFund)
  .put("/:id", isAuthorize("damayan fun", "update"), damayanFundIdRules, damayanFundRules, validateData, damayanFundController.updateDamayanFund)
  .delete("/:id", isAuthorize("damayan fun", "delete"), damayanFundIdRules, validateData, damayanFundController.deleteDamayanFund);

module.exports = damayanFundRoutes;
