const express = require("express");
const expenseVoucherController = require("./expense-voucher.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { expenseVoucherIdRules, expenseVoucherRules } = require("./expense-voucher.validation.js");

const expenseVoucherRoutes = express.Router();

expenseVoucherRoutes
  .get("/", expenseVoucherController.getExpenseVouchers)
  .get("/:id", expenseVoucherIdRules, validateData, expenseVoucherController.getExpenseVoucher)
  .post("/", expenseVoucherRules, validateData, expenseVoucherController.createExpenseVoucher)
  .put("/:id", expenseVoucherIdRules, expenseVoucherRules, validateData, expenseVoucherController.updateExpenseVoucher)
  .delete("/:id", expenseVoucherIdRules, validateData, expenseVoucherController.deleteExpenseVoucher);

module.exports = expenseVoucherRoutes;
