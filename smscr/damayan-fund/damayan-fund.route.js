const express = require("express");
const damayanFundController = require("./damayan-fund.controller.js");
const entryCtrl = require("./entries/damayan-fund-entries.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { damayanFundIdRules, damayanFundRules, updateDamayanFundCodeRules, updateDamayanFundRules, damayanFundCodeRules } = require("./damayan-fund.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");
const { damayanFundEntryIdRules, damayanFundEntryRules } = require("./entries/damayan-fund-entries.validation.js");

const damayanFundRoutes = express.Router();

damayanFundRoutes
  .get("/print-all/detailed", isAuthorize("damayan fund", "print"), damayanFundController.printAllDetailed)
  .get("/print/detailed/:id", isAuthorize("damayan fund", "print"), damayanFundController.printDetailedById)
  .get("/print-all/summary", isAuthorize("damayan fund", "print"), damayanFundController.printAllSummary)
  .get("/print/summary/:id", isAuthorize("damayan fund", "print"), damayanFundController.printSummaryById)
  .get("/export-all/summary", isAuthorize("damayan fund", "export"), damayanFundController.exportAllSummary)
  .get("/export/summary/:id", isAuthorize("damayan fund", "export"), damayanFundController.exportSummaryById)
  .get("/export-all/detailed", isAuthorize("damayan fund", "export"), damayanFundController.exportAllDetailed)
  .get("/export/detailed/:id", isAuthorize("damayan fund", "export"), damayanFundController.exportDetailedById)

  .get("/selection", damayanFundController.getSelections)

  .get("/", isAuthorize("damayan fund", "visible"), damayanFundController.getDamayanFunds)
  .get("/entries/:id", isAuthorize("damayan fund", "visible"), damayanFundIdRules, validateData, entryCtrl.getEntries)

  .get("/:id", isAuthorize("damayan fund", "read"), damayanFundIdRules, validateData, damayanFundController.getDamayanFund)

  .post("/", isAuthorize("damayan fund", "create"), damayanFundCodeRules, damayanFundRules, validateData, damayanFundController.createDamayanFund)
  .post("/entries/:id", isAuthorize("damayan fund", "update"), damayanFundIdRules, damayanFundEntryRules, validateData, entryCtrl.createEntry)

  .put("/:id", isAuthorize("damayan fund", "update"), damayanFundIdRules, updateDamayanFundCodeRules, updateDamayanFundRules, validateData, damayanFundController.updateDamayanFund)
  .put("/entries/:id/:entryId", isAuthorize("damayan fund", "update"), damayanFundIdRules, damayanFundEntryIdRules, damayanFundEntryRules, validateData, entryCtrl.updateEntry)

  .delete("/:id", isAuthorize("damayan fund", "delete"), damayanFundIdRules, validateData, damayanFundController.deleteDamayanFund)
  .delete("/entries/:id/:entryId", isAuthorize("damayan fund", "update"), damayanFundIdRules, damayanFundEntryIdRules, validateData, entryCtrl.deleteEntry);

module.exports = damayanFundRoutes;
