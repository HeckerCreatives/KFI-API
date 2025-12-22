const { param, body } = require("express-validator");
const FinancialStatement = require("./financial-statement.schema");
const { isValidObjectId, default: mongoose } = require("mongoose");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema");
const FinancialStatementEntry = require("./financial-statement-entry.schema");
const { hasDuplicateLines } = require("../../utils/line-duplicate-checker");

exports.financialStatementIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Financial statement id is required")
    .isMongoId()
    .withMessage("Invalid financial statement id")
    .bail()
    .custom(async value => {
      const exists = await FinancialStatement.exists({ _id: value, deletedAt: null }).exec();
      if (!exists) throw new Error("Financial statement not found / deleted.");
      return true;
    }),
];

exports.financialStatementRules = [
  body("reportCode")
    .trim()
    .notEmpty()
    .withMessage("Report code is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Report code can only consist of 1 to 255 characters")
    .custom(async (value, { req }) => {
      const code = value.toUpperCase();
      const id = req.params.id;
      if (id && !isValidObjectId(id)) throw Error("Invalid financial statement id");

      const query = { reportCode: code, deletedAt: null };
      if (id) query._id = { $ne: id };

      const exists = await FinancialStatement.exists(query).exec();
      if (exists) throw new Error("Report code already exists");

      return true;
    }),
  body("reportName").trim().notEmpty().withMessage("Report name is required").isLength({ min: 1, max: 255 }).withMessage("Report name can only consist of 1 to 255 characters"),
  body("type")
    .trim()
    .notEmpty()
    .withMessage("Type is required")
    .toUpperCase()
    .isIn(FinancialStatement.schema.path("type").enumValues)
    .withMessage(`Invalid type. Allowed values: ${FinancialStatement.schema.path("type").enumValues.join(", ")}`),
  body("primaryYear").trim().notEmpty().withMessage("Primary year is required").isNumeric().withMessage("Primary year must be a number"),
  body("primaryMonth").trim().notEmpty().withMessage("Primary month is required").isNumeric().withMessage("Secondary year must be a number"),
  body("secondaryYear").optional({ checkFalsy: true }).isNumeric().withMessage("Secondary year must be a number"),
  body("secondaryMonth").optional({ checkFalsy: true }).isNumeric().withMessage("Secondary month must be a number"),
];

exports.financialStatementEntriesRules = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ min: 1, max: 255 }).withMessage("Title can only consist of 1 to 255 characters"),
  body("subTitle").trim().notEmpty().withMessage("Sub Title is required").isLength({ min: 1, max: 255 }).withMessage("Sub Title can only consist of 1 to 255 characters"),
  body("entries")
    .isArray()
    .withMessage("Entries must be an array.")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Entries must be an array");
      if (value.length < 1) throw new Error("Entries must be atleast 1");
      return true;
    }),
  ,
  body("entries.*.line").trim().notEmpty().withMessage("Line is required").isNumeric().withMessage("Line must be a number"),
  body("entries.*.acctCode")
    .trim()
    .notEmpty()
    .withMessage("Account code id is required")
    .isMongoId()
    .withMessage("Invalid account code id")
    .custom(async value => {
      const exists = await ChartOfAccount.exists({ _id: value }).exec();
      if (!exists) throw new Error("Account code not found.");
      return true;
    }),
  body("entries.*.remarks").optional({ checkFalsy: true }).isLength({ min: 1, max: 255 }).withMessage("Remarks can only consist of 1 to 255 characters"),
  body("entries.*.amountType")
    .trim()
    .notEmpty()
    .withMessage("Amount type is required")
    .toLowerCase()
    .isIn(FinancialStatementEntry.schema.path("amountType").enumValues)
    .withMessage(`Invalid type. Allowed values: ${FinancialStatementEntry.schema.path("amountType").enumValues.join(", ")}`),
  body("root").custom((value, { req }) => {
    const entries = req.body.entries;
    if (hasDuplicateLines(entries)) throw new Error("Make sure there is no duplicate line no.");
    return true;
  }),
  body("deletedIds")
    .if(body("deletedIds").notEmpty())
    .if(body("deletedIds").isArray())
    .isArray()
    .withMessage("Invalid deleted ids")
    .custom(async value => {
      if (!Array.isArray(value)) throw new Error("Invalid entry ids");

      const validIds = value.filter(id => mongoose.Types.ObjectId.isValid(id));
      if (validIds.length !== value.length) throw new Error("Invalid beginning balance entry id format detected");

      const deletedIds = await FinancialStatementEntry.countDocuments({ _id: { $in: value }, deletedAt: null }).exec();
      if (deletedIds !== value.length) throw new Error("Please check all the deleted values");

      return true;
    }),
];
