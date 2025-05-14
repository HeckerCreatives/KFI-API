const express = require("express");
const supplierController = require("./supplier.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { supplierRules, supplierIdRules, updateSupplierRules } = require("./supplier.validation.js");

const supplierRoutes = express.Router();

supplierRoutes
  .get("/", supplierController.getSuppliers)
  .get("/:id", supplierIdRules, validateData, supplierController.getSupplier)
  .post("/", supplierRules, validateData, supplierController.createSupplier)
  .put("/:id", supplierIdRules, updateSupplierRules, validateData, supplierController.updateSupplier)
  .delete("/:id", supplierIdRules, validateData, supplierController.deleteSupplier);

module.exports = supplierRoutes;
