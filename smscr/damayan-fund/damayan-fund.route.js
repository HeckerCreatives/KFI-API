const express = require("express");
const damayanFundController = require("./damayan-fund.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { damayanFundIdRules, damayanFundRules } = require("./damayan-fund.validation.js");

const damayanFundRoutes = express.Router();

damayanFundRoutes
  .get("/", damayanFundController.getDamayanFunds)
  .get("/:id", damayanFundIdRules, validateData, damayanFundController.getDamayanFund)
  .post("/", damayanFundRules, validateData, damayanFundController.createDamayanFund)
  .put("/:id", damayanFundIdRules, damayanFundRules, validateData, damayanFundController.updateDamayanFund)
  .delete("/:id", damayanFundIdRules, validateData, damayanFundController.deleteDamayanFund);

module.exports = damayanFundRoutes;
