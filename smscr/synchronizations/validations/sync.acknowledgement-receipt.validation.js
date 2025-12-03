const { body } = require("express-validator");
const Release = require("../../release/release.schema");
const { isCodeUnique } = require("../../../utils/code-checker");
const Center = require("../../center/center.schema");
const ChartOfAccount = require("../../chart-of-account/chart-of-account.schema");
const Transaction = require("../../transactions/transaction.schema");
const { isValidObjectId } = require("mongoose");
const { hasBankEntry } = require("../../../utils/bank-entry-checker");
const { isAmountTally } = require("../../../utils/tally-amount");
const { hasDuplicateLines } = require("../../../utils/line-duplicate-checker");
const Bank = require("../../banks/bank.schema");

exports.acknowledgementReceiptUploadRules = [
  body("acknowledgementReceipts")
    .isArray()
    .withMessage("Acknowledgement receipts must be an array")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Acknowledgement receipts must be an array");
      if (value.length < 1) throw new Error("Atleast 1 acknowledgement receipt is required");
      if (!value.every(acknowledgement => !acknowledgement._synced)) throw new Error("Please make sure that the acknowledgement receipts sent are not yet synced in the database.");
      if (!value.every(acknowledgement => acknowledgement.action)) throw new Error("Please make sure that the acknowledgement receipts sent are have an action to make.");
      if (!value.every(acknowledgement => ["create", "update", "delete"].includes(acknowledgement.action)))
        throw new Error("An invalid action is found. Please make sure that the actions are only create, update and delete");

      return true;
    }),
  body("acknowledgementReceipts.*._id")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update" || value === "delete"))
    .trim()
    .notEmpty()
    .withMessage("Acknowledgement id is required")
    .isMongoId()
    .withMessage("Invalid acknowledgement id")
    .custom(async value => {
      const exists = await Release.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Acknowledgement not found");
      return true;
    }),
  body("acknowledgementReceipts.*.code")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("AR No is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("AR No must only consist of 1 to 255 characters")
    .matches(/^AR#[\d-]+$/i)
    .withMessage("AR# must start with AR# followed by numbers or hyphens"),
  ,
  body("acknowledgementReceipts.*.code")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "create"))
    .custom(async value => {
      const isUnique = await isCodeUnique(value);
      if (!isUnique) throw new Error("AR No. already exists");
      return true;
    }),
  body("acknowledgementReceipts.*.code")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update"))
    .custom(async (value, { req, path }) => {
      const match = path.match(/acknowledgementReceipts\[(\d+)\]\.code/);
      const index = match[1];
      const release = await Release.findById(req.body.acknowledgementReceipts[index]._id).lean().exec();
      const newValue = release.code.toUpperCase().startsWith("AR#") ? release.code : `AR#${release.code}`;
      if (newValue.toUpperCase() !== value.toUpperCase()) {
        const isUnique = await isCodeUnique(value);
        if (!isUnique) throw new Error("AR No. already exists");
      }
      return true;
    }),
  body("acknowledgementReceipts.*.centerLabel")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Center is required")
    .custom(async (value, { req, path }) => {
      const match = path.match(/acknowledgementReceipts\[(\d+)\]\.centerLabel/);
      const index = match[1];
      const centerId = req.body.acknowledgementReceipts[index].center;
      if (!isValidObjectId(centerId)) throw new Error("Invalid center");
      const exists = await Center.exists({ _id: centerId, deletedAt: null });
      if (!exists) throw new Error("Center not found");
      return true;
    }),
  body("acknowledgementReceipts.*.refNo")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("acknowledgementReceipts.*.refNo").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("Reference No. must only consist of 1 to 255 characters"),
  body("acknowledgementReceipts.*.remarks")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("acknowledgementReceipts.*.remarks").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("Particular must only consist of 1 to 255 characters"),
  body("acknowledgementReceipts.*.type")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Cash type is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Cash type must only consist of 1 to 255 characters"),
  body("acknowledgementReceipts.*.acctOfficer")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Account officer is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Account officer must only consist of 1 to 255 characters"),
  body("acknowledgementReceipts.*.date")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Date must be a valid date (YYYY-MM-DD)"),
  body("acknowledgementReceipts.*.acctMonth")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Account Month is required")
    .isNumeric()
    .withMessage("Account Month must be a number"),
  body("acknowledgementReceipts.*.acctYear")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Account Year is required")
    .isNumeric()
    .withMessage("Account Year must be a number"),
  body("acknowledgementReceipts.*.checkNo")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("acknowledgementReceipts.*.checkNo").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Check no. is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check no. must only consist of 1 to 255 characters"),
  body("acknowledgementReceipts.*.checkDate")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Check date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Check date must be a valid date (YYYY-MM-DD)")
    .custom((value, { req, path }) => {
      const match = path.match(/acknowledgementReceipts\[(\d+)\]\.checkDate/);
      const index = match[1];
      const date = req.body.acknowledgementReceipts[index].date;
      const checkDate = value;
      if (date !== checkDate) throw Error("Date and Check Date must be the same");
      return true;
    }),
  body("acknowledgementReceipts.*.bankCodeLabel")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Bank code is required")
    .custom(async (value, { req, path }) => {
      const match = path.match(/acknowledgementReceipts\[(\d+)\]\.bankCodeLabel/);
      const index = match[1];
      const bankId = req.body.acknowledgementReceipts[index].bankCode;
      if (!isValidObjectId(bankId)) throw new Error("Invalid bank code id");
      const exists = await Bank.exists({ _id: bankId, deletedAt: null });
      if (!exists) throw new Error("Invalid bank code id");
      return true;
    }),
  body("acknowledgementReceipts.*.amount")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Amount is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Amount must only consist of 1 to 255 characters")
    .isNumeric()
    .withMessage("Amount must be a number"),
  body("acknowledgementReceipts.*.cashCollection")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("acknowledgementReceipts.*.cashCollection").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Amount is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Amount must only consist of 1 to 255 characters")
    .isNumeric()
    .withMessage("Amount must be a number"),

  body("acknowledgementReceipts.*.entries")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update" || value === "create"))
    .isArray()
    .withMessage("Entries must be an array")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Invalid entries");
      if (value.length < 1) throw new Error("Atleast 1 entry is required");
      return true;
    }),
  body("acknowledgementReceipts.*.entries.*.line")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("acknowledgementReceipts.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Line is required")
    .isNumeric()
    .withMessage("Line must be a number")
    .isFloat({ min: 1 })
    .withMessage("1 is the minimum for Line"),
  body("acknowledgementReceipts.*.entries.*.week")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("acknowledgementReceipts.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("acknowledgementReceipts.*.entries.*.week").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Week is required")
    .isNumeric()
    .withMessage("Week must be a number")
    .isFloat({ min: 1 })
    .withMessage("1 is the minimum for Week"),
  body("acknowledgementReceipts.*.entries.*.cvNo")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("acknowledgementReceipts.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("acknowledgementReceipts.*.entries.*.cvNo").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("CV# is required")
    .custom(async (value, { req, path }) => {
      const match = path.match(/acknowledgementReceipts\[(\d+)\]\.entries\[(\d+)\]\.clientLabel/);
      const receiptIndex = match[1];
      const entryIndex = match[2];
      const entries = req.body.acknowledgementReceipts[receiptIndex].entries;
      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const loanReleaseId = entries[entryIndex].loanReleaseId;
      const exists = await Transaction.exists({ _id: loanReleaseId, deletedAt: null });
      if (!exists) throw new Error("CV# not found / deleted");
      return true;
    }),
  body("acknowledgementReceipts.*.entries.*.dueDate")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("acknowledgementReceipts.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("acknowledgementReceipts.*.entries.*.dueDate").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Due Date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Due Date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Due Date must be a valid date (YYYY-MM-DD)"),
  body("acknowledgementReceipts.*.entries.*.particular")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("acknowledgementReceipts.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("acknowledgementReceipts.*.entries.*.particular").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("Particular must only contain 1 to 255 characters"),
  body("acknowledgementReceipts.*.entries.*.acctCode")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("acknowledgementReceipts.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Account code is required")
    .custom(async (value, { req, path }) => {
      const match = path.match(/acknowledgementReceipts\[(\d+)\]\.entries\[(\d+)\]\.acctCode/);
      const receiptIndex = match[1];
      const entryIndex = match[2];
      const entries = req.body.acknowledgementReceipts[receiptIndex].entries;
      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const acctCodeId = entries[entryIndex].acctCodeId;
      const exists = await ChartOfAccount.exists({ _id: acctCodeId, deletedAt: null });
      if (!exists) throw new Error("Account code not found / deleted");
      return true;
    }),
  body("acknowledgementReceipts.*.entries.*.debit")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("acknowledgementReceipts.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("entries.*.debit").notEmpty())
    .isNumeric()
    .withMessage("Debit must be a number"),
  body("acknowledgementReceipts.*.entries.*.credit")
    .if(body("acknowledgementReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("acknowledgementReceipts.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("entries.*.credit").notEmpty())
    .isNumeric()
    .withMessage("Credit must be a number"),
  body("root").custom(async (value, { req }) => {
    const acknowledgementReceipts = req.body.acknowledgementReceipts;

    let haveBankEntry = [];
    let haveDuplicateLines = [];
    let debitCreditBalanced = [];
    let netDebitCreditBalanced = [];
    let netAmountBalanced = [];

    await Promise.all(
      acknowledgementReceipts.map(async acknowledgementReceipt => {
        if (acknowledgementReceipt.action === "delete") return;
        const validated = await handleRootValidation(acknowledgementReceipt.entries, acknowledgementReceipt.amount);
        haveBankEntry.push(validated.haveBankEntry);
        haveDuplicateLines.push(validated.haveDuplicateLines);
        debitCreditBalanced.push(validated.debitCreditBalanced);
        netDebitCreditBalanced.push(validated.netDebitCreditBalanced);
        netAmountBalanced.push(validated.netAmountBalanced);
      })
    );

    if (!haveBankEntry.every(e => e)) throw new Error("Bank entry is required");
    if (!haveDuplicateLines.every(e => !e)) throw new Error("Make sure there is no duplicate line no.");
    if (!debitCreditBalanced.every(e => e)) throw new Error("Debit and Credit must be balanced.");
    if (!netDebitCreditBalanced.every(e => e)) throw new Error("Please check all the amount in the entries");
    if (!netAmountBalanced.every(e => e)) throw new Error("Amount and Net Amount must be balanced");

    return true;
  }),
];

const handleRootValidation = async (entries, amount) => {
  amount = typeof amount === "string" ? Number(amount) : amount;
  const toBeSavedEntries = entries.filter(e => ["create", "update", "retain"].includes(e.action));

  const haveBankEntry = await hasBankEntry(toBeSavedEntries);
  const haveDuplicateLines = hasDuplicateLines(toBeSavedEntries);
  const { debitCreditBalanced, netDebitCreditBalanced, netAmountBalanced } = isAmountTally(toBeSavedEntries, amount);

  return {
    haveBankEntry,
    haveDuplicateLines,
    debitCreditBalanced,
    netDebitCreditBalanced,
    netAmountBalanced,
  };
};
