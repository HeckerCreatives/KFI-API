const express = require("express");
const customerController = require("./customer.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { customerIdRules, customerRules, updateCustomerRules } = require("./customer.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const customerRoutes = express.Router();

customerRoutes
  .get("/", isAuthorize("master client file", "visible"), customerController.getCustomers)
  .get("/:id", isAuthorize("master client file", "read"), customerIdRules, validateData, customerController.getCustomer)
  .post("/", isAuthorize("master client file", "create"), customerRules, validateData, customerController.createCustomer)
  .put("/:id", isAuthorize("master client file", "update"), customerIdRules, updateCustomerRules, validateData, customerController.updateCustomer)
  .delete("/:id", isAuthorize("master client file", "delete"), customerIdRules, validateData, customerController.deleteCustomer);

module.exports = customerRoutes;
