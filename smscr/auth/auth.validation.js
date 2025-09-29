const { body } = require("express-validator");
const { platforms } = require("../../constants/platforms");

exports.loginRules = [
  body("username").trim().notEmpty().withMessage("Username is required").isLength({ min: 3, max: 30 }).withMessage("Username must consist of 6 to 30 characters"),
  body("password").trim().notEmpty().withMessage("Password is required").isLength({ min: 6, max: 30 }).withMessage("Password must consist of 6 to 30 characters"),
  body("deviceName").trim().notEmpty().withMessage("Device name is required").isLength({ min: 6, max: 30 }).withMessage("Device name must consist of 6 to 30 characters"),
  body("deviceType")
    .trim()
    .notEmpty()
    .withMessage("Device type is required")
    .isLength({ min: 6, max: 30 })
    .withMessage("Device type must consist of 6 to 30 characters")
    .custom(value => {
      if (!platforms.includes(value)) throw new Error("Invalid platform");
      return true;
    }),
];
