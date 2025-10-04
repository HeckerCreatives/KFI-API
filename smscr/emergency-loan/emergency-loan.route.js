const express = require("express");
const emergencyLoanController = require("./emergency-loan.controller.js");
const entryCtrl = require("./entries/emergency-loan-entry.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const {
  emergencyLoanIdRules,
  emergencyLoanRules,
  createEmergencyLoanCodeRules,
  updateEmergencyLoanCodeRules,
  updateEmergencyLoanRules,
} = require("./emergency-loan.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const emergencyLoanRoutes = express.Router();

emergencyLoanRoutes
  .get("/print/by-document/detailed", isAuthorize("emergency loan", "print"), emergencyLoanController.printAllDetailed)
  .get("/print/by-document/summary", isAuthorize("emergency loan", "print"), emergencyLoanController.printAllSummary)
  .get("/print/by-date/detailed", isAuthorize("emergency loan", "print"), emergencyLoanController.printAllDetailedByDate)
  .get("/print/by-date/summary", isAuthorize("emergency loan", "print"), emergencyLoanController.printAllSummarizedByDate)
  .post("/print/by-accounts/detailed", isAuthorize("emergency loan", "print"), emergencyLoanController.printByAccountCodeDetailed)
  .post("/print/by-accounts/summary", isAuthorize("emergency loan", "print"), emergencyLoanController.printByAccountCodeSummarized)

  .get("/export/by-document/summary", isAuthorize("emergency loan", "export"), emergencyLoanController.exportAllSummary)
  .get("/export/by-document/detailed", isAuthorize("emergency loan", "export"), emergencyLoanController.exportAllDetailed)
  .get("/export/by-date/summary", isAuthorize("emergency loan", "export"), emergencyLoanController.exportAllSummarizedByDate)
  .get("/export/by-date/detailed", isAuthorize("emergency loan", "export"), emergencyLoanController.exportAllDetailedByDate)
  .post("/export/by-accounts/summary", isAuthorize("emergency loan", "export"), emergencyLoanController.exportByAccountCodeSummarized)
  .post("/export/by-accounts/detailed", isAuthorize("emergency loan", "export"), emergencyLoanController.exportByAccountCodeDetailed)

  .get("/print/file/:id", isAuthorize("emergency loan", "print"), emergencyLoanIdRules, validateData, emergencyLoanController.printFile)
  .get("/export/file/:id", isAuthorize("emergency loan", "export"), emergencyLoanIdRules, validateData, emergencyLoanController.exportFile)

  // .get("/print/detailed/:id", isAuthorize("emergency loan", "print"), emergencyLoanController.printDetailedById)
  // .get("/print/summary/:id", isAuthorize("emergency loan", "print"), emergencyLoanController.printSummaryById)
  // .get("/export/summary/:id", isAuthorize("emergency loan", "export"), emergencyLoanController.exportSummaryById)
  // .get("/export/detailed/:id", isAuthorize("emergency loan", "export"), emergencyLoanController.exportDetailedById)

  .get("/selection", emergencyLoanController.getSelections)

  .get("/", isAuthorize("emergency loan", "visible"), emergencyLoanController.getEmergencyLoans)
  .get("/:id", isAuthorize("emergency loan", "read"), emergencyLoanIdRules, validateData, emergencyLoanController.getEmergencyLoan)
  .get("/entries/:id", isAuthorize("emergency loan", "visible"), emergencyLoanIdRules, validateData, entryCtrl.getEntries)
  .get("/entries/all/:id", isAuthorize("emergency loan", "visible"), emergencyLoanIdRules, validateData, entryCtrl.getAllEntries)
  .post("/", isAuthorize("emergency loan", "create"), createEmergencyLoanCodeRules, emergencyLoanRules, validateData, emergencyLoanController.createEmergencyLoan)

  .put(
    "/:id",
    isAuthorize("emergency loan", "update"),
    emergencyLoanIdRules,
    updateEmergencyLoanCodeRules,
    updateEmergencyLoanRules,
    validateData,
    emergencyLoanController.updateEmergencyLoan
  )

  .delete("/:id", isAuthorize("emergency loan", "delete"), emergencyLoanIdRules, validateData, emergencyLoanController.deleteEmergencyLoan);
// .delete("/entries/:id/:entryId", isAuthorize("emergency loan", "update"), emergencyLoanIdRules, emergencyLoanEntryIdRules, validateData, entryCtrl.deleteEntry);
// .post("/entries/:id", isAuthorize("emergency loan", "update"), emergencyLoanIdRules, emergencyLoanEntryRules, validateData, entryCtrl.createEntry)
// .put(
//   "/entries/:id/:entryId",
//   isAuthorize("emergency loan", "update"),
//   emergencyLoanIdRules,
//   emergencyLoanEntryIdRules,
//   emergencyLoanEntryRules,
//   validateData,
//   entryCtrl.updateEntry
// )

module.exports = emergencyLoanRoutes;
