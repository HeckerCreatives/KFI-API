const express = require("express");
const systemParamCtrl = require("./system-parameter.controller.js");
const { isAuthorize } = require("../../middlewares/authorized.js");
const { updateSignatureParamRules } = require("./system-parameter.validation.js");
const { validateData } = require("../../validation/validate-data.js");

const systemParamRoutes = express.Router();

systemParamRoutes
  .get("/loan-release-entry", isAuthorize("parameters", "visible"), systemParamCtrl.getLoanReleaseEntryParams)
  .get("/signature", isAuthorize("parameters", "visible"), systemParamCtrl.getSignatureParams)
  .put("/signature/:id", isAuthorize("parameters", "update"), updateSignatureParamRules, validateData, systemParamCtrl.updateSignatureParam);

module.exports = systemParamRoutes;
