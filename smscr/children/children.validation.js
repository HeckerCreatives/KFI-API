const { param, body } = require("express-validator");
const Customer = require("../customer/customer.schema");
const Children = require("./children.schema");

exports.childrenIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Child id is required")
    .isMongoId()
    .withMessage("Invalid child id")
    .custom(async value => {
      const exists = await Children.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Child not found");
      return true;
    }),
];

exports.childrenRules = [
  body("owner")
    .trim()
    .notEmpty()
    .withMessage("Owner is required")
    .isMongoId()
    .withMessage("Invalid customer id")
    .custom(async value => {
      const exists = await Customer.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Customer not found");
      return true;
    }),
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 1, max: 255 }).withMessage("Name must only consist of 1 to 255 characters"),
];
