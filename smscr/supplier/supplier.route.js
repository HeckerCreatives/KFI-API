const express = require("express");
const supplierController = require("./supplier.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { supplierRules, supplierIdRules, updateSupplierRules } = require("./supplier.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const supplierRoutes = express.Router();

supplierRoutes
  .get("/", isAuthorize("supplier", "visible"), supplierController.getSuppliers)
  .get("/:id", isAuthorize("supplier", "read"), supplierIdRules, validateData, supplierController.getSupplier)
  .post("/", isAuthorize("supplier", "create"), supplierRules, validateData, supplierController.createSupplier)
  .put("/:id", isAuthorize("supplier", "update"), supplierIdRules, updateSupplierRules, validateData, supplierController.updateSupplier)
  .delete("/:id", isAuthorize("supplier", "delete"), supplierIdRules, validateData, supplierController.deleteSupplier);

module.exports = supplierRoutes;
