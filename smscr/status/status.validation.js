const { param, body } = require("express-validator");
const Status = require("./status.schema.js");

exports.statusIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Status id is required")
    .isMongoId()
    .withMessage("Invalid status id")
    .custom(async value => {
      const exists = await Status.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Status not found");
      return true;
    }),
];

exports.statusRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Code is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Code must only consist of 1 to 255 characters")
    .custom(async value => {
      const exists = await Status.exists({ code: value.toUpperCase(), deletedAt: null });
      if (exists) throw new Error("Status code already exists");
      return true;
    }),
  body("description").trim().notEmpty().withMessage("Description is required").isLength({ min: 1, max: 255 }).withMessage("Description must only consist of 1 to 255 characters"),
];

exports.updateStatusRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Code is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Code must only consist of 1 to 255 characters")
    .custom(async (value, { req }) => {
      const status = await Status.findById(req.params.id).lean().exec();
      if (status.code.toLowerCase() !== value.toLowerCase()) {
        const exists = await Status.exists({ code: value.toUpperCase(), deletedAt: null });
        if (exists) throw new Error("Status code already exists");
      }
      return true;
    }),
  body("description").trim().notEmpty().withMessage("Description is required").isLength({ min: 1, max: 255 }).withMessage("Description must only consist of 1 to 255 characters"),
];
