const express = require("express");
const acknowledgementCtrl = require("./acknowledgement.controller.js");
const entryCtrl = require("./entries/acknowledgement-entries.contoller.js");
const { validateData } = require("../../validation/validate-data.js");
const { acknowledgementIdRules, acknowledgementRules, updateAcknowledgementRules } = require("./acknowledgement.validation.js");
const { acknowledgementEntryIdRules, acknowledgementEntryRules } = require("./entries/acknowledgement-entries.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const acknowledgementRoutes = express.Router();

acknowledgementRoutes
  .get("/print-all/detailed", isAuthorize("acknowledgement", "print"), acknowledgementCtrl.printAllDetailed)
  .get("/print/detailed/:id", isAuthorize("acknowledgement", "print"), acknowledgementCtrl.printDetailedById)
  .get("/print-all/summary", isAuthorize("acknowledgement", "print"), acknowledgementCtrl.printAllSummary)
  .get("/print/summary/:id", isAuthorize("acknowledgement", "print"), acknowledgementCtrl.printSummaryById)
  .get("/export-all/summary", isAuthorize("acknowledgement", "export"), acknowledgementCtrl.exportAllSummary)
  .get("/export/summary/:id", isAuthorize("acknowledgement", "export"), acknowledgementCtrl.exportSummaryById)
  .get("/export-all/detailed", isAuthorize("acknowledgement", "export"), acknowledgementCtrl.exportAllDetailed)
  .get("/export/detailed/:id", isAuthorize("acknowledgement", "export"), acknowledgementCtrl.exportDetailedById)

  .get("/selection", acknowledgementCtrl.getSelections)
  .get("/", isAuthorize("acknowledgement", "visible"), acknowledgementCtrl.getAcknowledgements)
  .get("/entries/:id", isAuthorize("acknowledgement", "visible"), entryCtrl.getEntries)

  .post("/", isAuthorize("acknowledgement", "create"), acknowledgementRules, validateData, acknowledgementCtrl.createAcknowledgement)
  .post("/entries/:id", isAuthorize("acknowledgement", "update"), acknowledgementIdRules, acknowledgementEntryRules, validateData, entryCtrl.createEntry)

  .put("/:id", isAuthorize("acknowledgement", "update"), acknowledgementIdRules, updateAcknowledgementRules, validateData, acknowledgementCtrl.updateAcknowledgement)
  .put(
    "/entries/:id/:entryId",
    isAuthorize("acknowledgement", "update"),
    acknowledgementIdRules,
    acknowledgementEntryIdRules,
    acknowledgementEntryRules,
    validateData,
    entryCtrl.updateEntry
  )

  .delete("/:id", isAuthorize("acknowledgement", "delete"), acknowledgementIdRules, validateData, acknowledgementCtrl.deleteAcknowledgement)
  .delete("/entries/:id/:entryId", isAuthorize("acknowledgement", "update"), acknowledgementIdRules, acknowledgementEntryIdRules, validateData, entryCtrl.deleteEntry);

module.exports = acknowledgementRoutes;
