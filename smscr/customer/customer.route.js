const express = require("express");
const customerController = require("./customer.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { customerIdRules, customerRules, updateCustomerRules, printClientSummaryRules } = require("./customer.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");
const clientUploadCheck = require("./customer.upload.js");

const customerRoutes = express.Router();

customerRoutes
  .get("/statistics", customerController.getClientStats)
  .get("/by-center/:center", customerController.getClientsByCenter)
  .get("/list", customerController.getNameLists)
  .get("/selection", customerController.getSelections)
  .get("/print-all", isAuthorize("clients", "print"), customerController.printAll)
  .get("/print/:id", isAuthorize("clients", "print"), customerIdRules, validateData, customerController.print)
  .get("/print/soa/:id", isAuthorize("clients", "print"), customerIdRules, validateData, customerController.printSOA)
  .get("/print/client/summary", isAuthorize("clients", "print"), printClientSummaryRules, validateData, customerController.printClientSummary)

  .get("/export-all", isAuthorize("clients", "export"), customerController.exportAll)
  .get("/export/:id", isAuthorize("clients", "export"), customerIdRules, validateData, customerController.export)
  .get("/export/soa/:id", isAuthorize("clients", "export"), customerIdRules, validateData, customerController.exportSOA)
  .get("/export/client/summary", isAuthorize("clients", "export"), printClientSummaryRules, validateData, customerController.exportClientSummary)

  .get("/", isAuthorize("clients", "visible"), customerController.getCustomers)
  .get("/:id", isAuthorize("clients", "read"), customerIdRules, validateData, customerController.getCustomer)

  .post("/", isAuthorize("clients", "create"), clientUploadCheck, customerRules, validateData, customerController.createCustomer)
  .put("/:id", isAuthorize("clients", "update"), clientUploadCheck, customerIdRules, updateCustomerRules, validateData, customerController.updateCustomer)

  .delete("/:id", isAuthorize("clients", "delete"), customerIdRules, validateData, customerController.deleteCustomer);

module.exports = customerRoutes;
