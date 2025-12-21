const express = require("express");
const { activityReportRules, auditTrailReportRules } = require("./report.validation");
const { validateData } = require("../../validation/validate-data");
const reportCtrl = require("./report.controller.js");

const reportRoutes = express.Router();

reportRoutes
  .get("/print/gl/activity", activityReportRules, validateData, reportCtrl.printActivityReport)
  .get("/export/gl/activity", activityReportRules, validateData, reportCtrl.exportActivityReport)
  .get("/print/gl/audit-trail", auditTrailReportRules, validateData, reportCtrl.printAuditTrail)
  .get("/export/gl/audit-trail", auditTrailReportRules, validateData, reportCtrl.exportAuditTrail);

module.exports = reportRoutes;
