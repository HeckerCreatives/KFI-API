const express = require("express");
const releaseCtrl = require("./release.controller.js");
const entryCtrl = require("./entries/release-entries.contoller.js");
const { validateData } = require("../../validation/validate-data.js");
const { releaseIdRules, releaseRules, updateReleaseRules } = require("./release.validation.js");
const { releaseEntryIdRules, releaseEntryRules } = require("./entries/release-entries.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const releaseRoutes = express.Router();

releaseRoutes
  .get("/print-all/detailed", isAuthorize("release", "print"), releaseCtrl.printAllDetailed)
  .get("/print/detailed/:id", isAuthorize("release", "print"), releaseCtrl.printDetailedById)
  .get("/print-all/summary", isAuthorize("release", "print"), releaseCtrl.printAllSummary)
  .get("/print/summary/:id", isAuthorize("release", "print"), releaseCtrl.printSummaryById)
  .get("/export-all/summary", isAuthorize("release", "export"), releaseCtrl.exportAllSummary)
  .get("/export/summary/:id", isAuthorize("release", "export"), releaseCtrl.exportSummaryById)
  .get("/export-all/detailed", isAuthorize("release", "export"), releaseCtrl.exportAllDetailed)
  .get("/export/detailed/:id", isAuthorize("release", "export"), releaseCtrl.exportDetailedById)

  .get("/selection", releaseCtrl.getSelections)
  .get("/", isAuthorize("release", "visible"), releaseCtrl.getReleases)
  .get("/entries/:id", isAuthorize("release", "visible"), entryCtrl.getEntries)

  .post("/", isAuthorize("release", "create"), releaseRules, validateData, releaseCtrl.createRelease)
  .post("/entries/:id", isAuthorize("release", "update"), releaseIdRules, releaseEntryRules, validateData, entryCtrl.createEntry)

  .put("/:id", isAuthorize("release", "update"), releaseIdRules, updateReleaseRules, validateData, releaseCtrl.updateRelease)
  .put("/entries/:id/:entryId", isAuthorize("release", "update"), releaseIdRules, releaseEntryIdRules, releaseEntryRules, validateData, entryCtrl.updateEntry)

  .delete("/:id", isAuthorize("release", "delete"), releaseIdRules, validateData, releaseCtrl.deleteRelease)
  .delete("/entries/:id/:entryId", isAuthorize("release", "update"), releaseIdRules, releaseEntryIdRules, validateData, entryCtrl.deleteEntry);

module.exports = releaseRoutes;
