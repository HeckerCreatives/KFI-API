const { param, body } = require("express-validator");
const EmergencyLoan = require("./emergency-loan.schema");
const Bank = require("../banks/bank.schema");
const { isValidObjectId, default: mongoose } = require("mongoose");
const Customer = require("../customer/customer.schema");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema");
const { isCodeUnique } = require("../../utils/code-checker");
const EmergencyLoanEntry = require("./entries/emergency-loan-entry.schema");
const { hasBankEntry } = require("../../utils/bank-entry-checker");
const { hasDuplicateLines } = require("../../utils/line-duplicate-checker");
const { isAmountTally } = require("../../utils/tally-amount");

exports.createEmergencyLoanCodeRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("CV No is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("CV No must only consist of 1 to 255 characters")
    .custom(async (value, { req }) => {
      const isUnique = await isCodeUnique(value);
      if (!isUnique) throw new Error("CV No. already exists");
      return true;
    })
    .matches(/^CV#[\d-]+$/i)
    .withMessage("CV# must start with CV# followed by numbers or hyphens"),
  ,
];

exports.updateEmergencyLoanCodeRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("CV No is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("CV No must only consist of 1 to 255 characters")
    .custom(async (value, { req }) => {
      const emergencyLoan = await EmergencyLoan.findById(req.params.id).lean().exec();
      const newValue = emergencyLoan.code.toUpperCase().startsWith("CV#") ? emergencyLoan.code : `CV#${emergencyLoan.code}`;
      if (newValue.toUpperCase() !== value.toUpperCase()) {
        const isUnique = await isCodeUnique(value);
        if (!isUnique) throw new Error("CV No. already exists");
      }
      return true;
    })
    .matches(/^CV#[\d-]+$/i)
    .withMessage("CV# must start with CV# followed by numbers or hyphens"),
  ,
];

exports.emergencyLoanIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Emergency loan id is required")
    .isMongoId()
    .withMessage("Invalid emergency loan id")
    .custom(async value => {
      const exists = await EmergencyLoan.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Emergency loan not found");
      return true;
    }),
];

exports.emergencyLoanRules = [
  body("clientLabel")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Name must only contain 1 to 255 characters")
    .custom(async (value, { req, path }) => {
      const clientId = req.body.clientValue;
      if (!isValidObjectId(clientId)) throw new Error("Invalid client id");
      const exists = await Customer.exists({ _id: clientId, deletedAt: null });
      if (!exists) throw new Error("Client not found / deleted");
      return true;
    }),
  body("refNo").if(body("refNo").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Reference No. must only consist of 1 to 255 characters"),
  body("remarks").if(body("remarks").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Particular must only consist of 1 to 255 characters"),
  body("date")
    .trim()
    .notEmpty()
    .withMessage("Date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Date must be a valid date (YYYY-MM-DD)"),
  body("acctMonth").trim().notEmpty().withMessage("Account month is required").isLength({ min: 1, max: 255 }).withMessage("Account month must only consist of 1 to 255 characters"),
  body("acctYear").trim().notEmpty().withMessage("Account year is required").isLength({ min: 1, max: 255 }).withMessage("Account year must only consist of 1 to 255 characters"),
  body("checkNo")
    .if(body("checkNo").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Check no. is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check no. must only consist of 1 to 255 characters"),
  body("checkDate")
    .trim()
    .notEmpty()
    .withMessage("Check date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Check date must be a valid date (YYYY-MM-DD)")
    .custom((value, { req }) => {
      const date = req.body.date;
      const checkDate = value;
      if (date !== checkDate) throw Error("Date and Check Date must be the same");
      return true;
    }),
  body("bankCodeLabel")
    .trim()
    .notEmpty()
    .withMessage("Bank code is required")
    .custom(async (value, { req }) => {
      const bankId = req.body.bankCode;
      if (!bankId) throw new Error("Bank code is required");
      if (!isValidObjectId(bankId)) throw new Error("Invalid bank code");
      const exists = await Bank.exists({ _id: bankId, deletedAt: null });
      if (!exists) throw new Error("Invalid bank code id");
      return true;
    }),
  body("amount")
    .trim()
    .notEmpty()
    .withMessage("Amount is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Amount must only consist of 1 to 255 characters")
    .isNumeric()
    .withMessage("Amount must be a number"),
  body("entries")
    .isArray()
    .withMessage("Entries must be an array")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Invalid entries");
      if (value.length < 1) throw new Error("Atleast 1 entry is required");
      return true;
    }),
  body("entries.*.line")
    .trim()
    .notEmpty()
    .withMessage("Line is required")
    .isNumeric()
    .withMessage("Line must be a number")
    .isFloat({ min: 1 })
    .withMessage("1 is the minimum for Line"),
  body("entries.*.clientLabel")
    .if(body("entries.*.clientLabel").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Name must only contain 1 to 255 characters")
    .custom(async (value, { req, path }) => {
      const index = path.match(/entries\[(\d+)\]\.clientLabel/)[1];
      const entries = req.body.entries;
      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const clientId = entries[index].client;
      const exists = await Customer.exists({ _id: clientId, deletedAt: null });
      if (!exists) throw new Error("Client not found / deleted");
      return true;
    }),
  body("entries.*.acctCode")
    .trim()
    .notEmpty()
    .withMessage("Account code is required")
    .custom(async (value, { req, path }) => {
      const index = path.match(/entries\[(\d+)\]\.acctCode/)[1];
      const entries = req.body.entries;
      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const acctCodeId = entries[index].acctCodeId;
      const exists = await ChartOfAccount.exists({ _id: acctCodeId, deletedAt: null });
      if (!exists) throw new Error("Account code not found / deleted");
      return true;
    }),
  body("entries.*.debit").trim().notEmpty().withMessage("Debit is rquired").isNumeric().withMessage("Debit must be a number"),
  body("entries.*.credit").trim().notEmpty().withMessage("Debit is rquired").isNumeric().withMessage("Credit must be a number"),
  body("root").custom(async (value, { req }) => {
    const entries = req.body.entries;
    const amount = Number(req.body.amount);

    const haveBankEntry = await hasBankEntry(entries);
    if (!haveBankEntry) throw new Error("Bank entry is required");

    if (hasDuplicateLines(entries)) throw new Error("Make sure there is no duplicate line no.");

    const { debitCreditBalanced, netDebitCreditBalanced, netAmountBalanced } = isAmountTally(entries, amount);
    if (!debitCreditBalanced) throw new Error("Debit and Credit must be balanced.");
    if (!netDebitCreditBalanced) throw new Error("Please check all the amount in the entries");
    if (!netAmountBalanced) throw new Error("Amount and Net Amount must be balanced");

    return true;
  }),
];

exports.updateEmergencyLoanRules = [
  body("clientLabel")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Name must only contain 1 to 255 characters")
    .custom(async (value, { req, path }) => {
      const clientId = req.body.clientValue;
      if (!isValidObjectId(clientId)) throw new Error("Invalid client id");
      const exists = await Customer.exists({ _id: clientId, deletedAt: null });
      if (!exists) throw new Error("Client not found / deleted");
      return true;
    }),
  body("refNo").if(body("refNo").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Reference No. must only consist of 1 to 255 characters"),
  body("remarks").if(body("remarks").notEmpty()).isLength({ min: 1, max: 255 }).withMessage("Particular must only consist of 1 to 255 characters"),
  body("date")
    .trim()
    .notEmpty()
    .withMessage("Date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Date must be a valid date (YYYY-MM-DD)"),
  body("acctMonth").trim().notEmpty().withMessage("Account month is required").isLength({ min: 1, max: 255 }).withMessage("Account month must only consist of 1 to 255 characters"),
  body("acctYear").trim().notEmpty().withMessage("Account year is required").isLength({ min: 1, max: 255 }).withMessage("Account year must only consist of 1 to 255 characters"),
  body("checkNo")
    .if(body("checkNo").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Check no. is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check no. must only consist of 1 to 255 characters"),
  body("checkDate")
    .trim()
    .notEmpty()
    .withMessage("Check date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Check date must be a valid date (YYYY-MM-DD)")
    .custom((value, { req }) => {
      const date = req.body.date;
      const checkDate = value;
      if (date !== checkDate) throw Error("Date and Check Date must be the same");
      return true;
    }),
  body("bankCodeLabel")
    .trim()
    .notEmpty()
    .withMessage("Bank code is required")
    .custom(async (value, { req }) => {
      const bankId = req.body.bankCode;
      if (!bankId) throw new Error("Bank code is required");
      if (!isValidObjectId(bankId)) throw new Error("Invalid bank code");
      const exists = await Bank.exists({ _id: bankId, deletedAt: null });
      if (!exists) throw new Error("Invalid bank code id");
      return true;
    }),
  body("amount")
    .trim()
    .notEmpty()
    .withMessage("Amount is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Amount must only consist of 1 to 255 characters")
    .isNumeric()
    .withMessage("Amount must be a number"),
  body("entries")
    .isArray()
    .withMessage("Entries must be an array")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Invalid entries");
      if (value.length < 1) throw new Error("Atleast 1 entry is required");
      return true;
    }),
  body("entries.*.line")
    .trim()
    .notEmpty()
    .withMessage("Line is required")
    .isNumeric()
    .withMessage("Line must be a number")
    .isFloat({ min: 1 })
    .withMessage("1 is the minimum for Line"),
  body("entries.*.clientLabel")
    .if(body("entries.*.clientLabel").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Name must only contain 1 to 255 characters")
    .custom(async (value, { req, path }) => {
      const index = path.match(/entries\[(\d+)\]\.clientLabel/)[1];
      const entries = req.body.entries;
      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const clientId = entries[index].client;
      const exists = await Customer.exists({ _id: clientId, deletedAt: null });
      if (!exists) throw new Error("Client not found / deleted");
      return true;
    }),
  body("entries.*.acctCode")
    .trim()
    .notEmpty()
    .withMessage("Account code is required")
    .custom(async (value, { req, path }) => {
      const index = path.match(/entries\[(\d+)\]\.acctCode/)[1];
      const entries = req.body.entries;
      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const acctCodeId = entries[index].acctCodeId;
      const exists = await ChartOfAccount.exists({ _id: acctCodeId, deletedAt: null });
      if (!exists) throw new Error("Account code not found / deleted");
      return true;
    }),
  body("entries.*.debit").trim().notEmpty().withMessage("Debit is rquired").isNumeric().withMessage("Debit must be a number"),
  body("entries.*.credit").trim().notEmpty().withMessage("Debit is rquired").isNumeric().withMessage("Credit must be a number"),
  body("root").custom(async (value, { req }) => {
    const entries = req.body.entries;
    const amount = Number(req.body.amount);

    const haveBankEntry = await hasBankEntry(entries);
    if (!haveBankEntry) throw new Error("Bank entry is required");

    if (hasDuplicateLines(entries)) throw new Error("Make sure there is no duplicate line no.");

    const { debitCreditBalanced, netDebitCreditBalanced, netAmountBalanced } = isAmountTally(entries, amount);
    if (!debitCreditBalanced) throw new Error("Debit and Credit must be balanced.");
    if (!netDebitCreditBalanced) throw new Error("Please check all the amount in the entries");
    if (!netAmountBalanced) throw new Error("Amount and Net Amount must be balanced");

    return true;
  }),
  body("deletedIds")
    .if(body("deletedIds").notEmpty())
    .isArray()
    .withMessage("Invalid deleted ids")
    .custom(async value => {
      if (!Array.isArray(value)) {
        throw new Error("Invalid entries");
      }

      const validIds = value.filter(id => mongoose.Types.ObjectId.isValid(id));
      if (validIds.length !== value.length) {
        throw new Error("Invalid Id format detected");
      }

      const deletedIds = await EmergencyLoanEntry.countDocuments({ _id: { $in: value } }).exec();
      if (deletedIds !== value.length) {
        throw new Error("Please check all the deleted values");
      }

      return true;
    }),
];
