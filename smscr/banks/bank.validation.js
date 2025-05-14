const { param, body } = require("express-validator");
const Bank = require("./bank.schema");

exports.bankIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Bank id is required")
    .isMongoId()
    .withMessage("Invalid bank id")
    .custom(async value => {
      const exists = await Bank.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Bank not found");
      return true;
    }),
];

exports.bankRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Code is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Code must only consist of 1 to 255 characters")
    .custom(async value => {
      const exists = await Bank.exists({ code: value.toUpperCase(), deletedAt: null });
      if (exists) throw new Error("Bank code already exists");
      return true;
    }),
  body("description").trim().notEmpty().withMessage("Description is required").isLength({ min: 1, max: 255 }).withMessage("Description must only consist of 1 to 255 characters"),
];

exports.updateBankRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Code is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Code must only consist of 1 to 255 characters")
    .custom(async (value, { req }) => {
      const bank = await Bank.findById(req.params.id).lean().exec();
      if (bank.code.toLowerCase() !== value.toLowerCase()) {
        const exists = await Bank.exists({ code: value.toUpperCase(), deletedAt: null });
        if (exists) throw new Error("Bank code already exists");
      }
      return true;
    }),
  body("description").trim().notEmpty().withMessage("Description is required").isLength({ min: 1, max: 255 }).withMessage("Description must only consist of 1 to 255 characters"),
];
