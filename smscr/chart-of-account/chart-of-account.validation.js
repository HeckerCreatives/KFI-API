const { body, param } = require("express-validator");
const GroupAccount = require("../group-account/group-account.schema.js");
const ChartOfAccount = require("./chart-of-account.schema.js");

exports.chartOfAccountIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Chart Of Account Id is required")
    .isMongoId()
    .withMessage("Invalid Chart of Account Id")
    .custom(async value => {
      const exists = await ChartOfAccount.exists({ _id: value, deletedAt: null });
      if (!exists) {
        throw new Error("Chart of Account not found.");
      }
      return true;
    }),
];

exports.chartOfAccountRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Code is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Code must consist of only 1 to 255 characters.")
    .custom(async value => {
      const exists = await ChartOfAccount.exists({ code: value.toUpperCase(), deletedAt: null });
      if (exists) {
        throw new Error("Chart of Account code already exists.");
      }
      return true;
    }),
  body("description").trim().notEmpty().withMessage("Description is required").isLength({ min: 1, max: 255 }).withMessage("Description must consist of only 1 to 255 characters."),
  body("classification")
    .trim()
    .notEmpty()
    .withMessage("Classification is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Classification must consist of only 1 to 255 characters."),
  body("nature").trim().notEmpty().withMessage("Nature is required").isLength({ min: 1, max: 255 }).withMessage("Nature must consist of only 1 to 255 characters."),
  body("groupAccount")
    .trim()
    .notEmpty()
    .withMessage("Group Account")
    .isMongoId()
    .withMessage("Invalid Group Account Id")
    .custom(async value => {
      const exists = await GroupAccount.exists({ _id: value, deletedAt: null });
      if (!exists) {
        throw new Error("Group Account not found.");
      }
      return true;
    }),
  body("fsCode").trim().notEmpty().withMessage("FS Code").isLength({ min: 1, max: 255 }).withMessage("FS Code must consist of only 1 to 255 characters."),
  body("mainAcctNo")
    .trim()
    .notEmpty()
    .withMessage("Main Account No. is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Main Account No. must consist of only 1 to 255 characters."),
  body("subAcctNo").trim().notEmpty().withMessage("Sub Account No.").isLength({ min: 1, max: 255 }).withMessage("Sub Account No. must consist of only 1 to 255 characters."),
  body("branchCode").trim().notEmpty().withMessage("Branch Code is required").isLength({ min: 1, max: 255 }).withMessage("Branch Code must consist of only 1 to 255 characters."),
  body("sequence").trim().notEmpty().withMessage("Sequence is required").isLength({ min: 1, max: 255 }).withMessage("Sequence must consist of only 1 to 255 characters."),
  body("parent").trim().notEmpty().withMessage("Parent is required").isLength({ min: 1, max: 255 }).withMessage("Parent must consist of only 1 to 255 characters."),
  body("indention").trim().notEmpty().withMessage("Indention is required").isLength({ min: 1, max: 255 }).withMessage("Indention must consist of only 1 to 255 characters."),
  body("detailed").isBoolean().withMessage("Invalid detailed value"),
];

exports.updateChartOfAccountRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Code is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Code must consist of only 1 to 255 characters.")
    .custom(async (value, { req }) => {
      const chartAccount = await ChartOfAccount.findById(req.params.id).lean().exec();
      if (chartAccount.code.toLowerCase() !== value.toLowerCase()) {
        const exists = await ChartOfAccount.exists({ code: value.toUpperCase(), deletedAt: null });
        if (exists) throw new Error("Chart of account code already exists");
      }
      return true;
    }),
  body("description").trim().notEmpty().withMessage("Description is required").isLength({ min: 1, max: 255 }).withMessage("Description must consist of only 1 to 255 characters."),
  body("classification")
    .trim()
    .notEmpty()
    .withMessage("Classification is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Classification must consist of only 1 to 255 characters."),
  body("nature").trim().notEmpty().withMessage("Nature is required").isLength({ min: 1, max: 255 }).withMessage("Nature must consist of only 1 to 255 characters."),
  body("groupAccount")
    .trim()
    .notEmpty()
    .withMessage("Group Account")
    .isMongoId()
    .withMessage("Invalid Group Account Id")
    .custom(async value => {
      const exists = await GroupAccount.exists({ _id: value, deletedAt: null });
      if (!exists) {
        throw new Error("Group Account not found.");
      }
      return true;
    }),
  body("fsCode").trim().notEmpty().withMessage("FS Code").isLength({ min: 1, max: 255 }).withMessage("FS Code must consist of only 1 to 255 characters."),
  body("mainAcctNo")
    .trim()
    .notEmpty()
    .withMessage("Main Account No. is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Main Account No. must consist of only 1 to 255 characters."),
  body("subAcctNo").trim().notEmpty().withMessage("Sub Account No.").isLength({ min: 1, max: 255 }).withMessage("Sub Account No. must consist of only 1 to 255 characters."),
  body("branchCode").trim().notEmpty().withMessage("Branch Code is required").isLength({ min: 1, max: 255 }).withMessage("Branch Code must consist of only 1 to 255 characters."),
  body("sequence").trim().notEmpty().withMessage("Sequence is required").isLength({ min: 1, max: 255 }).withMessage("Sequence must consist of only 1 to 255 characters."),
  body("parent").trim().notEmpty().withMessage("Parent is required").isLength({ min: 1, max: 255 }).withMessage("Parent must consist of only 1 to 255 characters."),
  body("indention").trim().notEmpty().withMessage("Indention is required").isLength({ min: 1, max: 255 }).withMessage("Indention must consist of only 1 to 255 characters."),
  body("detailed").isBoolean().withMessage("Invalid detailed value"),
];
