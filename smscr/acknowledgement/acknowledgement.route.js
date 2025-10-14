const express = require("express");
const acknowledgementCtrl = require("./acknowledgement.controller.js");
const entryCtrl = require("./entries/acknowledgement-entries.contoller.js");
const { validateData } = require("../../validation/validate-data.js");
const { acknowledgementIdRules, acknowledgementRules, updateAcknowledgementRules } = require("./acknowledgement.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const acknowledgementRoutes = express.Router();

acknowledgementRoutes
  .get("/load-entries", acknowledgementCtrl.loadEntries)

  .get("/print/file/:id", isAuthorize("acknowledgement", "print"), acknowledgementIdRules, validateData, acknowledgementCtrl.printFile)
  .get("/export/file/:id", isAuthorize("acknowledgement", "export"), acknowledgementIdRules, validateData, acknowledgementCtrl.exportFile)

  .get("/print/by-document/detailed", isAuthorize("acknowledgement", "print"), acknowledgementCtrl.printAllDetailed)
  .get("/print/by-document/summary", isAuthorize("acknowledgement", "print"), acknowledgementCtrl.printAllSummary)
  .get("/print/by-date/account-officer", isAuthorize("acknowledgement", "print"), acknowledgementCtrl.printByDateAccountOfficer)
  .get("/print/by-date/summary", isAuthorize("acknowledgement", "print"), acknowledgementCtrl.printByDateSummarized)
  .post("/print/by-accounts/summary", isAuthorize("acknowledgement", "print"), acknowledgementCtrl.printByAccountCodeSummarized)

  .get("/export/by-document/summary", isAuthorize("acknowledgement", "export"), acknowledgementCtrl.exportAllSummary)
  .get("/export/by-document/detailed", isAuthorize("acknowledgement", "export"), acknowledgementCtrl.exportAllDetailed)
  .get("/export/by-date/account-officer", isAuthorize("acknowledgement", "export"), acknowledgementCtrl.exportByDateAccountOfficer)
  .get("/export/by-date/summary", isAuthorize("acknowledgement", "export"), acknowledgementCtrl.exportByDateSummarized)
  .post("/export/by-accounts/summary", isAuthorize("acknowledgement", "export"), acknowledgementCtrl.exportByAccountCodeSummarized)

  // .get("/print/detailed/:id", isAuthorize("acknowledgement", "print"), acknowledgementCtrl.printDetailedById)
  // .get("/print/summary/:id", isAuthorize("acknowledgement", "print"), acknowledgementCtrl.printSummaryById)
  // .get("/export/detailed/:id", isAuthorize("acknowledgement", "export"), acknowledgementCtrl.exportDetailedById)
  // .get("/export/summary/:id", isAuthorize("acknowledgement", "export"), acknowledgementCtrl.exportSummaryById)

  .get("/selection", acknowledgementCtrl.getSelections)
  .get("/", isAuthorize("acknowledgement", "visible"), acknowledgementCtrl.getAcknowledgements)
  .get("/entries/:id", isAuthorize("acknowledgement", "visible"), entryCtrl.getEntries)
  .get("/entries/all/:id", isAuthorize("acknowledgement", "visible"), entryCtrl.getAllEntries)

  .post("/", isAuthorize("acknowledgement", "create"), acknowledgementRules, validateData, acknowledgementCtrl.createAcknowledgement)
  .put("/:id", isAuthorize("acknowledgement", "update"), acknowledgementIdRules, updateAcknowledgementRules, validateData, acknowledgementCtrl.updateAcknowledgement)
  .delete("/:id", isAuthorize("acknowledgement", "delete"), acknowledgementIdRules, validateData, acknowledgementCtrl.deleteAcknowledgement);

// .post("/entries/:id", isAuthorize("acknowledgement", "update"), acknowledgementIdRules, acknowledgementEntryRules, validateData, entryCtrl.createEntry)
// .put(
//   "/entries/:id/:entryId",
//   isAuthorize("acknowledgement", "update"),
//   acknowledgementIdRules,
//   acknowledgementEntryIdRules,
//   acknowledgementEntryRules,
//   validateData,
//   entryCtrl.updateEntry
// )
// .delete("/entries/:id/:entryId", isAuthorize("acknowledgement", "update"), acknowledgementIdRules, acknowledgementEntryIdRules, validateData, entryCtrl.deleteEntry);

module.exports = acknowledgementRoutes;
