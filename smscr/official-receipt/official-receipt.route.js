const express = require("express");
const officialReceiptController = require("./official-receipt.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { officialReceiptIdRules, officialReceiptRules } = require("./official-receipt.validation.js");

const officialReceiptRoutes = express.Router();

officialReceiptRoutes
  .get("/", officialReceiptController.getOfficialReceipts)
  .get("/:id", officialReceiptIdRules, validateData, officialReceiptController.getOfficialReceipt)
  .post("/", officialReceiptRules, validateData, officialReceiptController.createOfficialReceipt)
  .put("/:id", officialReceiptIdRules, officialReceiptRules, validateData, officialReceiptController.updateOfficialReceipt)
  .delete("/:id", officialReceiptIdRules, validateData, officialReceiptController.deleteOfficialReceipt);

module.exports = officialReceiptRoutes;
