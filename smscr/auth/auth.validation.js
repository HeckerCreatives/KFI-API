const { body } = require("express-validator");

exports.loginRules = [
  body("username").trim().notEmpty().withMessage("Username is required").isLength({ min: 6, max: 30 }).withMessage("Username must consist of 6 to 30 characters"),
  body("password").trim().notEmpty().withMessage("Password is required").isLength({ min: 6, max: 30 }).withMessage("Password must consist of 6 to 30 characters"),
];
