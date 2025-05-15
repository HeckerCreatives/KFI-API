const express = require("express");
const customerController = require("./customer.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { customerIdRules, customerRules, updateCustomerRules } = require("./customer.validation.js");

const customerRoutes = express.Router();

customerRoutes
  .get("/", customerController.getCustomers)
  .get("/:id", customerIdRules, validateData, customerController.getCustomer)
  .post("/", customerRules, validateData, customerController.createCustomer)
  .put("/:id", customerIdRules, updateCustomerRules, validateData, customerController.updateCustomer)
  .delete("/:id", customerIdRules, validateData, customerController.deleteCustomer);

module.exports = customerRoutes;
