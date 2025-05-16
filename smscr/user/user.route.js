const express = require("express");
const userController = require("./user.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { userIdRules, userRules, permissionRules } = require("./user.validation.js");

const userRoutes = express.Router();

userRoutes
  .get("/", userController.getUsers)
  .get("/:id", userIdRules, validateData, userController.getUser)
  .post("/", userRules, validateData, userController.createUser)
  .put("/change-password", userIdRules, validateData, userController.changePassword)
  .put("/permissions/:id", userIdRules, permissionRules, validateData, userController.updatePermissions)
  .delete("/:id", userIdRules, validateData, userController.deleteUser);

module.exports = userRoutes;
