const { param, body } = require("express-validator");
const User = require("./user.schema");
const { ALL_RESOURCES } = require("../../constants/resources");
const { isValidObjectId } = require("mongoose");
const { platforms } = require("../../constants/platforms");

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

exports.permissionRules = [
  body("platform")
    .trim()
    .notEmpty()
    .withMessage("Platform is required")
    .custom(value => {
      if (!platforms.includes(value)) throw new Error("Invalid platform");
      return true;
    }),
  body("permissions")
    .isArray()
    .withMessage("Permissions must be an array")
    .custom(permissions => permissions.length > 0)
    .withMessage("At least one permission is required"),
  body("permissions.*.resource").isString().withMessage("Resource must be a string").isIn(ALL_RESOURCES).withMessage("Invalid resource type"),
  body("permissions.*._id").isMongoId().withMessage("Invalid permissions id"),
  body("permissions.*.actions").isObject().withMessage("Invalid actions"),
  body("permissions.*.actions.create").isBoolean().withMessage("Create action must be boolean"),
  body("permissions.*.actions.update").isBoolean().withMessage("Update action must be boolean"),
  body("permissions.*.actions.delete").isBoolean().withMessage("Delete action must be boolean"),
  body("permissions.*.actions.view").isBoolean().withMessage("View action must be boolean"),
  body("permissions.*.actions.print").isBoolean().withMessage("Print action must be boolean"),
  body("permissions.*.actions.export").isBoolean().withMessage("Visible must be boolean"),
  body("permissions.*.actions.visible").isBoolean().withMessage("Visible must be boolean"),
];

exports.banUserRules = [
  body("ids")
    .isArray()
    .withMessage("User ids must be in an array")
    .custom(value => value.length > 0)
    .withMessage("Please select user to ban")
    .custom(value => {
      return value.every(id => isValidObjectId(id));
    })
    .withMessage("All user ids must be valid id"),
  ,
];
