const express = require("express");
const systemParamCtrl = require("./system-parameter.controller.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const systemParamRoutes = express.Router();

systemParamRoutes.get("/", isAuthorize("parameters", "visible"), systemParamCtrl.getLoanReleaseEntryParams);

module.exports = systemParamRoutes;
