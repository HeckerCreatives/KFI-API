const { param, body } = require("express-validator");
const Nature = require("./nature.schema");

exports.natureIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Nature id is required")
    .isMongoId()
    .withMessage("Invalid nature id")
    .custom(async value => {
      const exists = await Nature.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Nature not found");
      return true;
    }),
];

exports.natureRules = [body("type").trim().notEmpty().withMessage("Type is required").isLength({ min: 1, max: 255 }).withMessage("Type must only contain 1 to 255 characters")];
