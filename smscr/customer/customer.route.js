const express = require("express");
const customerController = require("./customer.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { customerIdRules, customerRules, updateCustomerRules } = require("./customer.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const customerRoutes = express.Router();

customerRoutes
  .get("/", isAuthorize("client master file", "visible"), customerController.getCustomers)
  .get("/:id", isAuthorize("client master file", "read"), customerIdRules, validateData, customerController.getCustomer)
  .post("/", isAuthorize("client master file", "create"), customerRules, validateData, customerController.createCustomer)
  .put("/:id", isAuthorize("client master file", "update"), customerIdRules, updateCustomerRules, validateData, customerController.updateCustomer)
  .delete("/:id", isAuthorize("client master file", "delete"), customerIdRules, validateData, customerController.deleteCustomer);

module.exports = customerRoutes;
