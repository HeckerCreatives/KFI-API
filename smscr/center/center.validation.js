const { param, body } = require("express-validator");
const Center = require("./center.schema.js");

exports.centerIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Center id is required")
    .isMongoId()
    .withMessage("Invalid center id")
    .custom(async value => {
      const exists = await Center.exists({ _id: value });
      if (!exists) {
        throw new Error("Center not found");
      }
      return true;
    }),
];

exports.centerRules = [
  body("centerNo")
    .trim()
    .notEmpty()
    .withMessage("Center No. is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Center No. must only consist of 255 characters")
    .custom(async value => {
      const exists = await Center.exists({ deletedAt: null, centerNo: value.toUpperCase() }).exec();
      if (exists) throw new Error("Center no already exists.");
      return true;
    }),
  body("description").trim().notEmpty().withMessage("Description is required").isLength({ min: 1, max: 255 }).withMessage("Description must only consist of 255 characters"),
  body("location").trim().notEmpty().withMessage("Location is required").isLength({ min: 1, max: 255 }).withMessage("Location must only consist of 255 characters"),
  body("centerChief").trim().notEmpty().withMessage("Center Chief is required").isLength({ min: 1, max: 255 }).withMessage("Center Chief must only consist of 255 characters"),
  body("treasurer").trim().notEmpty().withMessage("Treasurer is required").isLength({ min: 1, max: 255 }).withMessage("Treasurer must only consist of 255 characters"),
  body("acctOfficer")
    .trim()
    .notEmpty()
    .withMessage("Account Officer is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Account Officer must only consist of 255 characters"),
];
