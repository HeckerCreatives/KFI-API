const express = require("express");
const supplierController = require("./supplier.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { supplierRules, supplierIdRules, updateSupplierRules } = require("./supplier.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const supplierRoutes = express.Router();

supplierRoutes
  .get("/selection", supplierController.getSelections)
  .get("/", isAuthorize("business supplier", "visible"), supplierController.getSuppliers)
  .get("/:id", isAuthorize("business supplier", "read"), supplierIdRules, validateData, supplierController.getSupplier)
  .post("/", isAuthorize("business supplier", "create"), supplierRules, validateData, supplierController.createSupplier)
  .put("/:id", isAuthorize("business supplier", "update"), supplierIdRules, updateSupplierRules, validateData, supplierController.updateSupplier)
  .delete("/:id", isAuthorize("business supplier", "delete"), supplierIdRules, validateData, supplierController.deleteSupplier);

module.exports = supplierRoutes;
