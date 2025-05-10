const { param, body } = require("express-validator");
const BusinessType = require("./business-type.schema");

exports.businessTypeIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Business type id is required")
    .isMongoId()
    .withMessage("Invalid business type id")
    .custom(async value => {
      const exists = await BusinessType.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Business type not found");
      return true;
    }),
];

exports.businessTypeRules = [
  body("type").trim().notEmpty().withMessage("Type is required").isLength({ min: 1, max: 255 }).withMessage("Type must only consist of 1 to 255 characters"),
];
