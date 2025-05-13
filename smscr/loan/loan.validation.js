const { param, body } = require("express-validator");
const Loan = require("./loan.schema");

exports.loanIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Loan id is required")
    .isMongoId()
    .withMessage("Invalid loan id")
    .custom(async value => {
      const exists = await Loan.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Loan not found");
      return true;
    }),
];

exports.loanRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Code is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Code must only consist of 1 to 255 characters")
    .custom(async value => {
      const exists = await Loan.exists({ code: value.toUpperCase(), deletedAt: null });
      if (exists) throw new Error("Loan code already exists");
      return true;
    }),
  body("description").trim().notEmpty().withMessage("Description is required").isLength({ min: 1, max: 255 }).withMessage("Description must only consist of 1 to 255 characters"),
];

exports.updateLoanRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Code is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Code must only consist of 1 to 255 characters")
    .custom(async (value, { req }) => {
      const loan = await Loan.findById(req.params.id).lean().exec();
      if (loan.code.toLowerCase() !== value.toLowerCase()) {
        const exists = await Loan.exists({ code: value.toUpperCase(), deletedAt: null });
        if (exists) throw new Error("Loan code already exists");
      }
      return true;
    }),
  body("description").trim().notEmpty().withMessage("Description is required").isLength({ min: 1, max: 255 }).withMessage("Description must only consist of 1 to 255 characters"),
];
