const express = require("express");
const customerController = require("./customer.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { customerIdRules, customerRules, updateCustomerRules } = require("./customer.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const customerRoutes = express.Router();

customerRoutes
  .get("/statistics", customerController.getClientStats)
  .get("/by-center/:center", customerController.getClientsByCenter)
  .get("/selection", customerController.getSelections)
  .get("/print-all", isAuthorize("clients", "print"), customerController.printAll)
  .get("/print/:id", isAuthorize("clients", "print"), customerIdRules, validateData, customerController.print)
  .get("/export-all", isAuthorize("clients", "export"), customerController.exportAll)
  .get("/export/:id", isAuthorize("clients", "export"), customerIdRules, validateData, customerController.export)
  .get("/", isAuthorize("clients", "visible"), customerController.getCustomers)
  .get("/:id", isAuthorize("clients", "read"), customerIdRules, validateData, customerController.getCustomer)
  .post("/", isAuthorize("clients", "create"), customerRules, validateData, customerController.createCustomer)
  .put("/:id", isAuthorize("clients", "update"), customerIdRules, updateCustomerRules, validateData, customerController.updateCustomer)
  .delete("/:id", isAuthorize("clients", "delete"), customerIdRules, validateData, customerController.deleteCustomer);

module.exports = customerRoutes;
