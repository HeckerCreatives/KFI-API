const { param, body } = require("express-validator");
const User = require("./user.schema");

exports.userIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("User id is required")
    .isMongoId()
    .withMessage("Invalid user id")
    .custom(async value => {
      const exists = await User.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("User not found");
      return true;
    }),
];

exports.userRules = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 1, max: 255 }).withMessage("Name must consist of 1 to 255 characters"),
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 6, max: 30 })
    .withMessage("Username must consist of 6 to 30 characters")
    .custom(async value => {
      const exists = await User.exists({ username: value });
      if (exists) throw new Error("Username already exists");
      return true;
    }),
  body("password").trim().notEmpty().withMessage("Password is required"),
  body("confirm_password")
    .trim()
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      const { password } = req.body;
      if (password !== value) throw new Error("Password and confirm password must match");
      return true;
    }),
];

exports.changePasswordRules = [
  body("current_password").trim().notEmpty().withMessage("Current password is required"),
  body("password").trim().notEmpty().withMessage("Password is required"),
  body("confirm_password")
    .trim()
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      const { password } = req.body;
      if (password !== value) throw new Error("Password and confirm password must match");
      return true;
    }),
];
