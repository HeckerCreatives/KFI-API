const express = require("express");
const officialReceiptController = require("./official-receipt.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { officialReceiptIdRules, officialReceiptRules } = require("./official-receipt.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const officialReceiptRoutes = express.Router();

officialReceiptRoutes
  .get("/", isAuthorize("official receipt", "visible"), officialReceiptController.getOfficialReceipts)
  .get("/:id", isAuthorize("official receipt", "read"), officialReceiptIdRules, validateData, officialReceiptController.getOfficialReceipt)
  .post("/", isAuthorize("official receipt", "create"), officialReceiptRules, validateData, officialReceiptController.createOfficialReceipt)
  .put("/:id", isAuthorize("official receipt", "update"), officialReceiptIdRules, officialReceiptRules, validateData, officialReceiptController.updateOfficialReceipt)
  .delete("/:id", isAuthorize("official receipt", "delete"), officialReceiptIdRules, validateData, officialReceiptController.deleteOfficialReceipt);

module.exports = officialReceiptRoutes;
