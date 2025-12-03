const { body } = require("express-validator");
const JournalVoucher = require("../../journal-voucher/journal-voucher.schema");
const { hasBankEntry } = require("../../../utils/bank-entry-checker");
const { hasDuplicateLines } = require("../../../utils/line-duplicate-checker");
const { isAmountTally } = require("../../../utils/tally-amount");
const { isCodeUnique } = require("../../../utils/code-checker");
const Bank = require("../../banks/bank.schema");
const { isValidObjectId } = require("mongoose");
const ChartOfAccount = require("../../chart-of-account/chart-of-account.schema");

exports.journalVouchersUploadRules = [
  body("journalVouchers")
    .isArray()
    .withMessage("Journal Vouchers must be an array")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Journal Vouchers must be an array");
      if (value.length < 1) throw new Error("Atleast 1 journal voucher is required");
      if (!value.every(journal => !journal._synced)) throw new Error("Please make sure that the journal vouchers sent are not yet synced in the database.");
      if (!value.every(journal => journal.action)) throw new Error("Please make sure that the journal vouchers sent are have an action to make.");
      if (!value.every(journal => ["create", "update", "delete"].includes(journal.action)))
        throw new Error("An invalid action is found. Please make sure that the actions are only create, update and delete");

      return true;
    }),
  body("journalVouchers.*._id")
    .if(body("journalVouchers.*.action").custom(value => value === "update" || value === "delete"))
    .trim()
    .notEmpty()
    .withMessage("Journal voucher id is required for updates and deletions")
    .isMongoId()
    .withMessage("An invalid journal voucher id exists in the array for update/delete. Please check if send ids are valid.")
    .custom(async value => {
      const exists = await JournalVoucher.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("A loan release for update/delete is not found / deleted already.");
      return true;
    }),
  body("journalVouchers.*.code")
    .if(body("journalVouchers.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("JV No is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("JV No must only consist of 1 to 255 characters")
    .matches(/^JV#[\d-]+$/i)
    .withMessage("JV# must start with JV# followed by numbers or hyphens"),
  body("journalVouchers.*.code")
    .if(body("journalVouchers.*.action").custom(value => value === "create"))
    .custom(async value => {
      const isUnique = await isCodeUnique(value);
      if (!isUnique) throw new Error("JV No. already exists");
      return true;
    }),
  body("journalVouchers.*.code")
    .if(body("journalVouchers.*.action").custom(value => value === "update"))
    .custom(async (value, { req, path }) => {
      const match = path.match(/journalVouchers\[(\d+)\]\.code/);
      const index = match[1];
      const journalVoucher = await JournalVoucher.findById(req.body.journalVouchers[index]._id).lean().exec();

      const newValue = journalVoucher.code.toUpperCase().startsWith("JV#") ? journalVoucher.code : `JV#${journalVoucher.code}`;
      if (newValue.toUpperCase() !== value.toUpperCase()) {
        const isUnique = await isCodeUnique(value);
        if (!isUnique) throw new Error("JV No. already exists");
      }
      return true;
    }),
  body("journalVouchers.*.nature")
    .if(body("journalVouchers.*.action").custom(value => value === "update" || value === "create"))
    .if(body("journalVouchers.*.nature").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Nature is required")
    .withMessage("Nature must only consist of 1 to 255 characters"),
  body("journalVouchers.*.date")
    .if(body("journalVouchers.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Date must be a valid date (YYYY-MM-DD)"),
  body("journalVouchers.*.acctMonth")
    .if(body("journalVouchers.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Account Month is required")
    .isNumeric()
    .withMessage("Account Month must be a number"),
  body("journalVouchers.*.acctYear")
    .if(body("journalVouchers.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Account Year is required")
    .isNumeric()
    .withMessage("Account Year must be a number"),
  body("journalVouchers.*.checkNo")
    .if(body("journalVouchers.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Check no. is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check no. must only consist of 1 to 255 characters"),
  body("journalVouchers.*.checkDate")
    .if(body("journalVouchers.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Check date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Check date must be a valid date (YYYY-MM-DD)")
    .custom((value, { req, path }) => {
      const match = path.match(/journalVouchers\[(\d+)\]\.checkDate/);
      const index = match[1];
      const date = req.body.journalVouchers[index].date;
      const checkDate = value;
      if (date !== checkDate) throw Error("Date and Check Date must be the same");
      return true;
    }),
  body("journalVouchers.*.refNo")
    .if(body("journalVouchers.*.action").custom(value => value === "update" || value === "create"))
    .if(body("refNo").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("Reference No. must only consist of 1 to 255 characters"),
  body("journalVouchers.*.bankLabel")
    .if(body("journalVouchers.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Bank code is required")
    .custom(async (value, { req, path }) => {
      const match = path.match(/journalVouchers\[(\d+)\]\.bankLabel/);
      const index = match[1];
      const bankId = req.body.journalVouchers[index].bank;
      if (!isValidObjectId(bankId)) throw new Error("Invalid bank code id");
      const exists = await Bank.exists({ _id: bankId, deletedAt: null });
      if (!exists) throw new Error("Invalid bank code id");
      return true;
    }),
  body("journalVouchers.*.amount")
    .if(body("journalVouchers.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Amount is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Amount must only consist of 1 to 255 characters")
    .isNumeric()
    .withMessage("Amount must be a number"),
  body("journalVouchers.*.remarks")
    .if(body("journalVouchers.*.action").custom(value => value === "update" || value === "create"))
    .if(body("remarks").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("Particular must only consist of 1 to 255 characters"),
  body("journalVouchers.*.entries")
    .if(body("journalVouchers.*.action").custom(value => value === "update" || value === "create"))
    .isArray()
    .withMessage("Entries must be an array")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Invalid entries");
      if (value.length < 1) throw new Error("Atleast 1 entry is required");
      return true;
    }),
  body("journalVouchers.*.entries.*.line")
    .if(body("journalVouchers.*.action").custom(value => value === "update" || value === "create"))
    .if(body("journalVouchers.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Line is required")
    .isNumeric()
    .withMessage("Line must be a number")
    .isFloat({ min: 1 })
    .withMessage("1 is the minimum for Line"),
  body("journalVouchers.*.entries.*.clientLabel")
    .if(body("journalVouchers.*.action").custom(value => value === "update" || value === "create"))
    .if(body("journalVouchers.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("journalVouchers.*.entries.*.clientLabel").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Name must only contain 1 to 255 characters")
    .custom(async (value, { req, path }) => {
      const match = path.match(/journalVouchers\[(\d+)\]\.entries\[(\d+)\]\.acctCode/);
      const voucherIndex = match[1];
      const entryIndex = match[2];
      const entries = req.body.journalVouchers[voucherIndex].entries;

      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const clientId = entries[entryIndex].client;
      const exists = await Customer.exists({ _id: clientId, deletedAt: null });
      if (!exists) throw new Error("Client not found / deleted");
      return true;
    }),
  body("journalVouchers.*.entries.*.particular")
    .if(body("journalVouchers.*.action").custom(value => value === "update" || value === "create"))
    .if(body("journalVouchers.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("journalVouchers.*.entries.*.particular").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("Particular must only contain 1 to 255 characters"),
  body("journalVouchers.*.entries.*.acctCode")
    .if(body("journalVouchers.*.action").custom(value => value === "update" || value === "create"))
    .if(body("journalVouchers.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Account code is required")
    .custom(async (value, { req, path }) => {
      const match = path.match(/journalVouchers\[(\d+)\]\.entries\[(\d+)\]\.acctCode/);
      const voucherIndex = match[1];
      const entryIndex = match[2];
      const entries = req.body.journalVouchers[voucherIndex].entries;

      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const acctCodeId = entries[entryIndex].acctCodeId;
      const exists = await ChartOfAccount.exists({ _id: acctCodeId, deletedAt: null });
      if (!exists) throw new Error("Account code not found / deleted");
      return true;
    }),
  body("journalVouchers.*.entries.*.debit")
    .if(body("journalVouchers.*.action").custom(value => value === "update" || value === "create"))
    .if(body("journalVouchers.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("entries.*.debit").notEmpty())
    .isNumeric()
    .withMessage("Debit must be a number"),
  body("journalVouchers.*.entries.*.credit")
    .if(body("journalVouchers.*.action").custom(value => value === "update" || value === "create"))
    .if(body("journalVouchers.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("entries.*.credit").notEmpty())
    .isNumeric()
    .withMessage("Credit must be a number"),
  body("journalVouchers.*.entries.*.cvForRecompute")
    .if(body("journalVouchers.*.action").custom(value => value === "update" || value === "create"))
    .if(body("journalVouchers.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("journalVouchers.*.entries.*.cvForRecompute").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("CV for recompute must only contain 1 to 255 characters"),
  body("root").custom(async (value, { req }) => {
    const journalVouchers = req.body.journalVouchers;

    let haveBankEntry = [];
    let haveDuplicateLines = [];
    let debitCreditBalanced = [];
    let netDebitCreditBalanced = [];
    let netAmountBalanced = [];

    await Promise.all(
      journalVouchers.map(async journalVoucher => {
        if (journalVoucher.action === "delete") return;
        const validated = await handleRootValidation(journalVoucher.entries, journalVoucher.amount);
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
