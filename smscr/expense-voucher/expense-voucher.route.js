const express = require("express");
const expenseVoucherController = require("./expense-voucher.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { expenseVoucherIdRules, expenseVoucherRules } = require("./expense-voucher.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const expenseVoucherRoutes = express.Router();

expenseVoucherRoutes
  .get("/", isAuthorize("expense voucher", "visible"), expenseVoucherController.getExpenseVouchers)
  .get("/:id", isAuthorize("expense voucher", "read"), expenseVoucherIdRules, validateData, expenseVoucherController.getExpenseVoucher)
  .post("/", isAuthorize("expense voucher", "create"), expenseVoucherRules, validateData, expenseVoucherController.createExpenseVoucher)
  .put("/:id", isAuthorize("expense voucher", "update"), expenseVoucherIdRules, expenseVoucherRules, validateData, expenseVoucherController.updateExpenseVoucher)
  .delete("/:id", isAuthorize("expense voucher", "delete"), expenseVoucherIdRules, validateData, expenseVoucherController.deleteExpenseVoucher);

module.exports = expenseVoucherRoutes;
