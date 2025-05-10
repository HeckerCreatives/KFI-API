const express = require("express");
const authController = require("./auth.controller.js");
const { loginRules } = require("./auth.validation.js");
const { validateData } = require("../../validation/validate-data.js");

const authRoutes = express.Router();

authRoutes.post("/login", loginRules, validateData, authController.login);

module.exports = authRoutes;
