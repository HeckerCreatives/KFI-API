const { param, body } = require("express-validator");
const { isValidObjectId, default: mongoose } = require("mongoose");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema");
const { hasDuplicateLines } = require("../../utils/line-duplicate-checker");
const TrialBalance = require("./trial-balance.schema");
const TrialBalanceEntry = require("./trial-balance-entry.schema");

exports.trialBalanceIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Trial balance id is required")
    .isMongoId()
    .withMessage("Invalid trial balance id")
    .bail()
    .custom(async value => {
      const exists = await TrialBalance.exists({ _id: value, deletedAt: null }).exec();
      if (!exists) throw new Error("Trial balance not found / deleted.");
      return true;
    }),
];

exports.trialBalanceRules = [
  body("reportCode")
    .trim()
    .notEmpty()
    .withMessage("Report code is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Report code can only consist of 1 to 255 characters")
    .custom(async (value, { req }) => {
      const code = value.toUpperCase();
      const id = req.params.id;
      if (id && !isValidObjectId(id)) throw Error("Invalid trial balance id");

      const query = { reportCode: code, deletedAt: null };
      if (id) query._id = { $ne: id };

      const exists = await TrialBalance.exists(query).exec();
      if (exists) throw new Error("Report code already exists");

      return true;
    }),
  body("reportName").trim().notEmpty().withMessage("Report name is required").isLength({ min: 1, max: 255 }).withMessage("Report name can only consist of 1 to 255 characters"),
];

exports.trialBalanceEntriesRules = [
  body("entries")
    .isArray()
    .withMessage("Entries must be an array.")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Entries must be an array");
      if (value.length < 1) throw new Error("Entries must be atleast 1");
      return true;
    }),
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

      const deletedIds = await TrialBalanceEntry.countDocuments({ _id: { $in: value }, deletedAt: null }).exec();
      if (deletedIds !== value.length) throw new Error("Please check all the deleted values");

      return true;
    }),
];
