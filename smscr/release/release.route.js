const express = require("express");
const releaseCtrl = require("./release.controller.js");
const entryCtrl = require("./entries/release-entries.contoller.js");
const { validateData } = require("../../validation/validate-data.js");
const { releaseIdRules, releaseRules, updateReleaseRules, loadEntryRules } = require("./release.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const releaseRoutes = express.Router();

releaseRoutes
  .get("/print/by-document/detailed", isAuthorize("release", "print"), releaseCtrl.printAllDetailed)
  .get("/print/by-document/summary", isAuthorize("release", "print"), releaseCtrl.printAllSummary)
  .get("/print/by-date/summary", isAuthorize("release", "print"), releaseCtrl.printByDateSummarized)
  .get("/print/by-date/account-officer", isAuthorize("release", "print"), releaseCtrl.printByDateAccountOfficer)
  .post("/print/by-accounts/summary", isAuthorize("release", "print"), releaseCtrl.printByAccountCodeSummarized)
  .post("/print/by-accounts/detailed", isAuthorize("release", "print"), releaseCtrl.printByAccountCodeDetailed)
  .post("/print/by-banks", isAuthorize("release", "print"), releaseCtrl.printByBanks)

  .get("/export/by-document/summary", isAuthorize("release", "export"), releaseCtrl.exportAllSummary)
  .get("/export/by-document/detailed", isAuthorize("release", "export"), releaseCtrl.exportAllDetailed)
  .get("/export/by-date/summary", isAuthorize("release", "export"), releaseCtrl.exportByDateSummarized)
  .get("/export/by-date/account-officer", isAuthorize("release", "export"), releaseCtrl.exportByDateAccountOfficer)
  .post("/export/by-accounts/summary", isAuthorize("release", "export"), releaseCtrl.exportByAccountCodeSummarized)
  .post("/export/by-accounts/detailed", isAuthorize("release", "export"), releaseCtrl.exportByAccountCodeDetailed)
  .post("/export/by-banks", isAuthorize("release", "export"), releaseCtrl.exportByBanks)

  .get("/print/file/:id", isAuthorize("release", "print"), releaseIdRules, validateData, releaseCtrl.printFile)
  .get("/export/file/:id", isAuthorize("release", "export"), releaseIdRules, validateData, releaseCtrl.exportFile)

  .get("/selection", releaseCtrl.getSelections)
  .get("/load-entries", releaseCtrl.loadEntries)
  .get("/", isAuthorize("release", "visible"), releaseCtrl.getReleases)
  .get("/entries/:id", isAuthorize("release", "visible"), entryCtrl.getEntries)
  .get("/entries/all/:id", isAuthorize("release", "visible"), entryCtrl.getAllEntries)

  .post("/", isAuthorize("release", "create"), releaseRules, validateData, releaseCtrl.createRelease)

  .put("/:id", isAuthorize("release", "update"), releaseIdRules, updateReleaseRules, validateData, releaseCtrl.updateRelease)

  .delete("/:id", isAuthorize("release", "delete"), releaseIdRules, validateData, releaseCtrl.deleteRelease);

// .post("/entries/:id", isAuthorize("release", "update"), releaseIdRules, releaseEntryRules, validateData, entryCtrl.createEntry)
// .put("/entries/:id/:entryId", isAuthorize("release", "update"), releaseIdRules, releaseEntryIdRules, releaseEntryRules, validateData, entryCtrl.updateEntry)
// .delete("/entries/:id/:entryId", isAuthorize("release", "update"), releaseIdRules, releaseEntryIdRules, validateData, entryCtrl.deleteEntry);
// .get("/print/detailed/:id", isAuthorize("release", "print"), releaseCtrl.printDetailedById)
// .get("/print/summary/:id", isAuthorize("release", "print"), releaseCtrl.printSummaryById)
// .get("/export/summary/:id", isAuthorize("release", "export"), releaseCtrl.exportSummaryById)
// .get("/export/detailed/:id", isAuthorize("release", "export"), releaseCtrl.exportDetailedById)

module.exports = releaseRoutes;
