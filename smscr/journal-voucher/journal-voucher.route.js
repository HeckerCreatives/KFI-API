const express = require("express");
const journalVoucherController = require("./journal-voucher.controller.js");
const entryCtrl = require("./entries/journal-voucher-entries.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { journalVoucherIdRules, journalVoucherRules, updateJournalVoucherRules } = require("./journal-voucher.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");
const { journalVoucherEntryIdRules, journalVoucherEntryRules } = require("./entries/journal-voucher-entries.validation.js");

const journalVoucherRoutes = express.Router();

journalVoucherRoutes
  .get("/print-all/detailed", isAuthorize("journal voucher", "print"), journalVoucherController.printAllDetailed)
  .get("/print/detailed/:id", isAuthorize("journal voucher", "print"), journalVoucherController.printDetailedById)
  .get("/print-all/summary", isAuthorize("journal voucher", "print"), journalVoucherController.printAllSummary)
  .get("/print/summary/:id", isAuthorize("journal voucher", "print"), journalVoucherController.printSummaryById)

  .get("/export-all/summary", isAuthorize("journal voucher", "export"), journalVoucherController.exportAllSummary)
  .get("/export/summary/:id", isAuthorize("journal voucher", "export"), journalVoucherController.exportSummaryById)
  .get("/export-all/detailed", isAuthorize("journal voucher", "export"), journalVoucherController.exportAllDetailed)
  .get("/export/detailed/:id", isAuthorize("journal voucher", "export"), journalVoucherController.exportDetailedById)

  .get("/selection", journalVoucherController.getSelections)
  .get("/", isAuthorize("journal voucher", "visible"), journalVoucherController.getJournalVouchers)
  .get("/entries/:id", isAuthorize("journal voucher", "visible"), entryCtrl.getEntries)
  .get("/entries/all/:id", isAuthorize("journal voucher", "visible"), entryCtrl.getAllEntries)
  .get("/:id", isAuthorize("journal voucher", "read"), journalVoucherIdRules, validateData, journalVoucherController.getJournalVoucher)

  .post("/", isAuthorize("journal voucher", "create"), journalVoucherRules, validateData, journalVoucherController.createJournalVoucher)

  .put("/:id", isAuthorize("journal voucher", "update"), journalVoucherIdRules, updateJournalVoucherRules, validateData, journalVoucherController.updateJournalVoucher)

  .delete("/:id", isAuthorize("journal voucher", "delete"), journalVoucherIdRules, validateData, journalVoucherController.deleteJournalVoucher);

// .post("/entries/:id", isAuthorize("journal voucher", "update"), journalVoucherIdRules, journalVoucherEntryRules, validateData, entryCtrl.createEntry)
// .put(
//   "/entries/:id/:entryId",
//   isAuthorize("journal voucher", "update"),
//   journalVoucherIdRules,
//   journalVoucherEntryIdRules,
//   journalVoucherEntryRules,
//   validateData,
//   entryCtrl.updateEntry
// )
// .delete("/entries/:id/:entryId", isAuthorize("journal voucher", "update"), journalVoucherIdRules, journalVoucherEntryIdRules, validateData, entryCtrl.deleteEntry);

module.exports = journalVoucherRoutes;
