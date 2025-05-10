const express = require("express");
const journalVoucherController = require("./journal-voucher.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { journalVoucherIdRules, journalVoucherRules } = require("./journal-voucher.validation.js");

const journalVoucherRoutes = express.Router();

journalVoucherRoutes
  .get("/", journalVoucherController.getJournalVouchers)
  .get("/:id", journalVoucherIdRules, validateData, journalVoucherController.getJournalVoucher)
  .post("/", journalVoucherRules, validateData, journalVoucherController.createJournalVoucher)
  .put("/:id", journalVoucherIdRules, journalVoucherRules, validateData, journalVoucherController.updateJournalVoucher)
  .delete("/:id", journalVoucherIdRules, validateData, journalVoucherController.deleteJournalVoucher);

module.exports = journalVoucherRoutes;
