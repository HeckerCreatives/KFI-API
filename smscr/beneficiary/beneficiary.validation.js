const { param, body } = require("express-validator");
const Beneficiary = require("./beneficiary.schema");
const Customer = require("../customer/customer.schema");

exports.beneficiaryIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Beneficiary id is required")
    .isMongoId()
    .withMessage("Invalid beneficiary id")
    .custom(async value => {
      const exists = await Beneficiary.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Beneficiary not found");
      return true;
    }),
];

exports.beneficiaryRules = [
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
  body("relationship")
    .trim()
    .notEmpty()
    .withMessage("Relationship is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Relationship must only consist of 1 to 255 characters"),
];
