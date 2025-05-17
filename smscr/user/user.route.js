const express = require("express");
const userController = require("./user.controller.js");
const { validateData } = require("../../validation/validate-data.js");
const { userIdRules, userRules, permissionRules, banUserRules, changePasswordRules } = require("./user.validation.js");
const { isAuthorize } = require("../../middlewares/authorized.js");

const userRoutes = express.Router();

userRoutes
  .get("/", isAuthorize("user", "visible"), userController.getUsers)
  .get("/:id", isAuthorize("user", "read"), userIdRules, validateData, userController.getUser)
  .post("/", isAuthorize("user", "create"), userRules, validateData, userController.createUser)
  .put("/change-password", isAuthorize("user", "update"), changePasswordRules, validateData, userController.changePassword)
  .put("/permissions/:id", isAuthorize("user", "update"), userIdRules, permissionRules, validateData, userController.updatePermissions)
  .put("/ban", isAuthorize("user", "update"), banUserRules, validateData, userController.banUsers)
  .put("/unbanned", isAuthorize("user", "update"), banUserRules, validateData, userController.unbannedUsers)
  .delete("/:id", isAuthorize("user", "delete"), userIdRules, validateData, userController.deleteUser);

module.exports = userRoutes;
