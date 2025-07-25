const express = require("express");
const expenseVoucherController = require("./expense-voucher.controller.js");
const entryCtrl = require("./entries/expense-voucher.entries.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { expenseVoucherIdRules, expenseVoucherRules, updateExpenseVoucherRules } = require("./expense-voucher.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");
const { expenseVoucherEntryRules, expenseVoucherEntryIdRules } = require("./entries/expense-voucher-entries.validation.js");

const expenseVoucherRoutes = express.Router();

expenseVoucherRoutes
  .get("/print-all/detailed", isAuthorize("expense voucher", "print"), expenseVoucherController.printAllDetailed)
  .get("/print/detailed/:id", isAuthorize("expense voucher", "print"), expenseVoucherController.printDetailedById)
  .get("/print-all/summary", isAuthorize("expense voucher", "print"), expenseVoucherController.printAllSummary)
  .get("/print/summary/:id", isAuthorize("expense voucher", "print"), expenseVoucherController.printSummaryById)
  .get("/export-all/summary", isAuthorize("expense voucher", "export"), expenseVoucherController.exportAllSummary)
  .get("/export/summary/:id", isAuthorize("expense voucher", "export"), expenseVoucherController.exportSummaryById)
  .get("/export-all/detailed", isAuthorize("expense voucher", "export"), expenseVoucherController.exportAllDetailed)
  .get("/export/detailed/:id", isAuthorize("expense voucher", "export"), expenseVoucherController.exportDetailedById)

  .get("/selection", expenseVoucherController.getSelections)
  .get("/", isAuthorize("expense voucher", "visible"), expenseVoucherController.getExpenseVouchers)
  .get("/entries/:id", isAuthorize("expense voucher", "visible"), entryCtrl.getEntries)

  .get("/:id", isAuthorize("expense voucher", "read"), expenseVoucherIdRules, validateData, expenseVoucherController.getExpenseVoucher)

  .post("/", isAuthorize("expense voucher", "create"), expenseVoucherRules, validateData, expenseVoucherController.createExpenseVoucher)
  .post("/entries/:id", isAuthorize("expense voucher", "update"), expenseVoucherIdRules, expenseVoucherEntryRules, validateData, entryCtrl.createEntry)

  .put("/:id", isAuthorize("expense voucher", "update"), expenseVoucherIdRules, updateExpenseVoucherRules, validateData, expenseVoucherController.updateExpenseVoucher)
  .put(
    "/entries/:id/:entryId",
    isAuthorize("expense voucher", "update"),
    expenseVoucherIdRules,
    expenseVoucherEntryIdRules,
    expenseVoucherEntryRules,
    validateData,
    entryCtrl.updateEntry
  )

  .delete("/:id", isAuthorize("expense voucher", "delete"), expenseVoucherIdRules, validateData, expenseVoucherController.deleteExpenseVoucher)
  .delete("/entries/:id/:entryId", isAuthorize("expense voucher", "update"), expenseVoucherIdRules, expenseVoucherEntryIdRules, validateData, entryCtrl.deleteEntry);

module.exports = expenseVoucherRoutes;
