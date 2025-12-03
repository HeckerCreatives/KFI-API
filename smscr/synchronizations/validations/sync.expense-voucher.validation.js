const { body } = require("express-validator");
const { hasBankEntry } = require("../../../utils/bank-entry-checker.js");
const { hasDuplicateLines } = require("../../../utils/line-duplicate-checker.js");
const { isAmountTally } = require("../../../utils/tally-amount.js");
const ExpenseVoucher = require("../../expense-voucher/expense-voucher.schema.js");
const { isCodeUnique } = require("../../../utils/code-checker");
const Customer = require("../../customer/customer.schema");
const { isValidObjectId } = require("mongoose");
const Bank = require("../../banks/bank.schema.js");
const ChartOfAccount = require("../../chart-of-account/chart-of-account.schema.js");

exports.expenseVouchersUploadRules = [
  body("expenseVouchers")
    .isArray()
    .withMessage("Expense vouchers must be an array")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Expense vouchers must be an array");
      if (value.length < 1) throw new Error("Atleast 1 expense voucher is required");
      if (!value.every(expense => !expense._synced)) throw new Error("Please make sure that the expense vouchers sent are not yet synced in the database.");
      if (!value.every(expense => expense.action)) throw new Error("Please make sure that the expense vouchers sent are have an action to make.");
      if (!value.every(expense => ["create", "update", "delete"].includes(expense.action)))
        throw new Error("An invalid action is found. Please make sure that the actions are only create, update and delete");

      return true;
    }),
  body("expenseVouchers.*._id")
    .if(body("expenseVouchers.*.action").custom(value => value === "update" || value === "delete"))
    .trim()
    .notEmpty()
    .withMessage("Expense voucher id is required for updates and deletions")
    .isMongoId()
    .withMessage("An invalid expense voucher id exists in the array for update/delete. Please check if send ids are valid.")
    .custom(async value => {
      const exists = await ExpenseVoucher.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Expense voucher not found");
      return true;
    }),
  body("expenseVouchers.*.code")
    .if(body("expenseVouchers.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("CV No is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("CV No must only consist of 1 to 255 characters")
    .matches(/^CV#[\d-]+$/i)
    .withMessage("CV# must start with CV# followed by numbers or hyphens"),
  body("expenseVouchers.*.code")
    .if(body("expenseVouchers.*.action").custom(value => value === "create"))
    .custom(async value => {
      const isUnique = await isCodeUnique(value);
      if (!isUnique) throw new Error("CV No. already exists");
      return true;
    }),
  body("expenseVouchers.*.code")
    .if(body("expenseVouchers.*.action").custom(value => value === "update"))
    .custom(async (value, { req, path }) => {
      const match = path.match(/expenseVouchers\[(\d+)\]\.code/);
      const index = match[1];
      const expenseVoucher = await ExpenseVoucher.findById(req.body.expenseVouchers[index]._id).lean().exec();
      const newValue = expenseVoucher.code.toUpperCase().startsWith("CV#") ? expenseVoucher.code : `CV#${expenseVoucher.code}`;
      if (newValue.toUpperCase() !== value.toUpperCase()) {
        const isUnique = await isCodeUnique(value);
        if (!isUnique) throw new Error("CV No. already exists");
        return true;
      }
      return true;
    }),
  body("expenseVouchers.*.supplier")
    .if(body("expenseVouchers.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Supplier is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Supplier must only consist of 1 to 255 characters"),
  body("expenseVouchers.*.acctMonth")
    .if(body("expenseVouchers.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Account Month is required")
    .isNumeric()
    .withMessage("Account Month must be a number"),
  body("expenseVouchers.*.acctYear")
    .if(body("expenseVouchers.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Account Year is required")
    .isNumeric()
    .withMessage("Account Year must be a number"),
  body("expenseVouchers.*.checkNo")
    .if(body("expenseVouchers.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Check no. is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check no. must only consist of 1 to 255 characters"),
  body("expenseVouchers.*.checkDate")
    .if(body("expenseVouchers.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Check date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Check date must be a valid date (YYYY-MM-DD)")
    .custom((value, { req, path }) => {
      const match = path.match(/expenseVouchers\[(\d+)\]\.checkDate/);
      const index = match[1];
      const date = req.body.expenseVouchers[index].date;
      const checkDate = value;
      if (date !== checkDate) throw Error("Date and Check Date must be the same");
      return true;
    }),
  body("expenseVouchers.*.date")
    .if(body("expenseVouchers.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Date must be a valid date (YYYY-MM-DD)"),
  body("expenseVouchers.*.refNo")
    .if(body("expenseVouchers.*.action").custom(value => value === "update" || value === "create"))
    .if(body("expenseVouchers.*.refNo").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("Reference No. must only consist of 1 to 255 characters"),
  body("expenseVouchers.*.bankLabel")
    .if(body("expenseVouchers.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Bank code is required")
    .custom(async (value, { req, path }) => {
      const match = path.match(/expenseVouchers\[(\d+)\]\.bankLabel/);
      const index = match[1];
      const bankId = req.body.expenseVouchers[index].bank;
      if (!isValidObjectId(bankId)) throw new Error("Invalid bank code id");
      const exists = await Bank.exists({ _id: bankId, deletedAt: null });
      if (!exists) throw new Error("Invalid bank code id");
      return true;
    }),
  body("expenseVouchers.*.amount")
    .if(body("expenseVouchers.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Amount is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Amount must only consist of 1 to 255 characters")
    .isNumeric()
    .withMessage("Amount must be a number"),
  body("expenseVouchers.*.remarks")
    .if(body("expenseVouchers.*.action").custom(value => value === "update" || value === "create"))
    .if(body("expenseVouchers.*.remarks").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("Particular must only consist of 1 to 255 characters"),
  body("expenseVouchers.*.entries")
    .if(body("expenseVouchers.*.action").custom(value => value === "update" || value === "create"))
    .isArray()
    .withMessage("Entries must be an array")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Invalid entries");
      if (value.length < 1) throw new Error("Atleast 1 entry is required");
      return true;
    }),
  body("expenseVouchers.*.entries.*.line")
    .if(body("expenseVouchers.*.action").custom(value => value === "update" || value === "create"))
    .if(body("expenseVouchers.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Line is required")
    .isNumeric()
    .withMessage("Line must be a number")
    .isFloat({ min: 1 })
    .withMessage("1 is the minimum for Line"),
  body("expenseVouchers.*.entries.*.clientLabel")
    .if(body("expenseVouchers.*.action").custom(value => value === "update" || value === "create"))
    .if(body("expenseVouchers.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("expenseVouchers.*.entries.*.clientLabel").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Name must only contain 1 to 255 characters")
    .custom(async (value, { req, path }) => {
      const match = path.match(/expenseVouchers\[(\d+)\]\.entries\[(\d+)\]\.clientLabel/);
      const voucherIndex = match[1];
      const entryIndex = match[2];
      const entries = req.body.expenseVouchers[voucherIndex].entries;

      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const clientId = entries[entryIndex].client;
      const exists = await Customer.exists({ _id: clientId, deletedAt: null });
      if (!exists) throw new Error("Client not found / deleted");
      return true;
    }),
  body("expenseVouchers.*.entries.*.particular")
    .if(body("expenseVouchers.*.action").custom(value => value === "update" || value === "create"))
    .if(body("expenseVouchers.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("expenseVouchers.*.entries.*.particular").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("Particular must only contain 1 to 255 characters"),
  body("expenseVouchers.*.entries.*.acctCode")
    .if(body("expenseVouchers.*.action").custom(value => value === "update" || value === "create"))
    .if(body("expenseVouchers.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Account code is required")
    .custom(async (value, { req, path }) => {
      const match = path.match(/expenseVouchers\[(\d+)\]\.entries\[(\d+)\]\.acctCode/);
      const voucherIndex = match[1];
      const entryIndex = match[2];
      const entries = req.body.expenseVouchers[voucherIndex].entries;

      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const acctCodeId = entries[entryIndex].acctCodeId;
      const exists = await ChartOfAccount.exists({ _id: acctCodeId, deletedAt: null });
      if (!exists) throw new Error("Account code not found / deleted");
      return true;
    }),
  body("expenseVouchers.*.entries.*.debit")
    .if(body("expenseVouchers.*.action").custom(value => value === "update" || value === "create"))
    .if(body("expenseVouchers.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("entries.*.debit").notEmpty())
    .isNumeric()
    .withMessage("Debit must be a number"),
  body("expenseVouchers.*.entries.*.credit")
    .if(body("expenseVouchers.*.action").custom(value => value === "update" || value === "create"))
    .if(body("expenseVouchers.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("entries.*.credit").notEmpty())
    .isNumeric()
    .withMessage("Credit must be a number"),
  body("expenseVouchers.*.entries.*.cvForRecompute")
    .if(body("expenseVouchers.*.action").custom(value => value === "update" || value === "create"))
    .if(body("expenseVouchers.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("expenseVouchers.*.entries.*.cvForRecompute").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("CV for recompute must only contain 1 to 255 characters"),
  body("root").custom(async (value, { req }) => {
    const expenseVouchers = req.body.expenseVouchers;

    let haveBankEntry = [];
    let haveDuplicateLines = [];
    let debitCreditBalanced = [];
    let netDebitCreditBalanced = [];
    let netAmountBalanced = [];

    await Promise.all(
      expenseVouchers.map(async expenseVoucher => {
        if (expenseVoucher.action === "delete") return;
        const validated = await handleRootValidation(expenseVoucher.entries, expenseVoucher.amount);
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
