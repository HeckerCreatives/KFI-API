const express = require("express");
const journalVoucherController = require("./journal-voucher.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { journalVoucherIdRules, journalVoucherRules } = require("./journal-voucher.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const journalVoucherRoutes = express.Router();

journalVoucherRoutes
  .get("/", isAuthorize("journal voucher", "visible"), journalVoucherController.getJournalVouchers)
  .get("/:id", isAuthorize("journal voucher", "read"), journalVoucherIdRules, validateData, journalVoucherController.getJournalVoucher)
  .post("/", isAuthorize("journal voucher", "create"), journalVoucherRules, validateData, journalVoucherController.createJournalVoucher)
  .put("/:id", isAuthorize("journal voucher", "update"), journalVoucherIdRules, journalVoucherRules, validateData, journalVoucherController.updateJournalVoucher)
  .delete("/:id", isAuthorize("journal voucher", "delete"), journalVoucherIdRules, validateData, journalVoucherController.deleteJournalVoucher);

module.exports = journalVoucherRoutes;
