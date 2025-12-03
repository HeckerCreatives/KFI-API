const { body } = require("express-validator");
const { isAmountTally } = require("../../../utils/tally-amount");
const { hasDuplicateLines } = require("../../../utils/line-duplicate-checker");
const { hasBankEntry } = require("../../../utils/bank-entry-checker");
const Acknowledgement = require("../../acknowledgement/acknowlegement.schema");
const { isCodeUnique } = require("../../../utils/code-checker");
const Center = require("../../center/center.schema");
const Bank = require("../../banks/bank.schema");
const Transaction = require("../../transactions/transaction.schema");
const Customer = require("../../customer/customer.schema");
const ChartOfAccount = require("../../chart-of-account/chart-of-account.schema");
const { isValidObjectId } = require("mongoose");

exports.officialReceiptsUploadRules = [
  body("officialReceipts")
    .isArray()
    .withMessage("Official Receipts must be an array")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Official Receipts must be an array");
      if (value.length < 1) throw new Error("Atleast 1 official receipt is required");
      if (!value.every(official => !official._synced)) throw new Error("Please make sure that the official receipts sent are not yet synced in the database.");
      if (!value.every(official => official.action)) throw new Error("Please make sure that the official receipts sent are have an action to make.");
      if (!value.every(official => ["create", "update", "delete"].includes(official.action)))
        throw new Error("An invalid action is found. Please make sure that the actions are only create, update and delete");

      return true;
    }),
  body("officialReceipts.*._id")
    .if(body("officialReceipts.*.action").custom(value => value === "update" || value === "delete"))
    .trim()
    .notEmpty()
    .withMessage("Official receipt id is required for updates and deletions")
    .isMongoId()
    .withMessage("An invalid official receipt id exists in the array for update/delete. Please check if send ids are valid.")
    .custom(async value => {
      const exists = await Acknowledgement.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Official receipt not found");
      return true;
    }),
  body("officialReceipts.*.code")
    .if(body("officialReceipts.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("OR No is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("OR No must only consist of 1 to 255 characters"),
  body("officialReceipts.*.code")
    .if(body("officialReceipts.*.action").custom(value => value === "create"))
    .custom(async value => {
      const isUnique = await isCodeUnique(value);
      if (!isUnique) throw new Error("OR No. already exists");
      return true;
    }),
  body("officialReceipts.*.code")
    .if(body("officialReceipts.*.action").custom(value => value === "update"))
    .custom(async (value, { req, path }) => {
      const match = path.match(/officialReceipts\[(\d+)\]\.code/);
      const index = match[1];
      const acknowledgement = await Acknowledgement.findById(req.body.officialReceipts[index]._id).lean().exec();
      if (acknowledgement.code.toUpperCase() !== value.toUpperCase()) {
        const isUnique = await isCodeUnique(value);
        if (!isUnique) throw new Error("Code already exists");
      }
      return true;
    }),
  body("officialReceipts.*.centerLabel")
    .if(body("officialReceipts.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Center is required")
    .custom(async (value, { req, path }) => {
      const match = path.match(/officialReceipts\[(\d+)\]\.centerLabel/);
      const index = match[1];
      const centerId = req.body.officialReceipts[index].center;
      if (!isValidObjectId(centerId)) throw new Error("Invalid center");
      const exists = await Center.exists({ _id: centerId, deletedAt: null });
      if (!exists) throw new Error("Center not found");
      return true;
    }),
  body("officialReceipts.*.refNo")
    .if(body("officialReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("officialReceipts.*.refNo").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("Reference No. must only consist of 1 to 255 characters"),
  body("officialReceipts.*.remarks")
    .if(body("officialReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("officialReceipts.*.remarks").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("Particular must only consist of 1 to 255 characters"),
  body("officialReceipts.*.type")
    .if(body("officialReceipts.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Cash type is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Cash type must only consist of 1 to 255 characters"),
  body("officialReceipts.*.acctOfficer")
    .if(body("officialReceipts.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Account officer is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Account officer must only consist of 1 to 255 characters"),
  body("officialReceipts.*.date")
    .if(body("officialReceipts.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Date must be a valid date (YYYY-MM-DD)"),
  body("officialReceipts.*.acctMonth")
    .if(body("officialReceipts.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Account Month is required")
    .isNumeric()
    .withMessage("Account Month must be a number"),
  body("officialReceipts.*.acctYear")
    .if(body("officialReceipts.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Account Year is required")
    .isNumeric()
    .withMessage("Account Year must be a number"),
  body("officialReceipts.*.checkNo")
    .if(body("officialReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("officialReceipts.*.checkNo").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Check no. is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check no. must only consist of 1 to 255 characters"),
  body("officialReceipts.*.checkDate")
    .if(body("officialReceipts.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Check date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Check date must be a valid date (YYYY-MM-DD)")
    .custom((value, { req, path }) => {
      const match = path.match(/officialReceipts\[(\d+)\]\.checkDate/);
      const index = match[1];
      const date = req.body.officialReceipts[index].date;
      const checkDate = value;
      if (date !== checkDate) throw Error("Date and Check Date must be the same");
      return true;
    }),
  body("officialReceipts.*.bankCodeLabel")
    .if(body("officialReceipts.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Bank code is required")
    .custom(async (value, { req, path }) => {
      const match = path.match(/officialReceipts\[(\d+)\]\.bankCodeLabel/);
      const index = match[1];
      const bankId = req.body.officialReceipts[index].bankCode;
      if (!isValidObjectId(bankId)) throw new Error("Invalid bank code id");
      const exists = await Bank.exists({ _id: bankId, deletedAt: null });
      if (!exists) throw new Error("Invalid bank code id");
      return true;
    }),
  body("officialReceipts.*.amount")
    .if(body("officialReceipts.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Amount is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Amount must only consist of 1 to 255 characters")
    .isNumeric()
    .withMessage("Amount must be a number"),
  body("officialReceipts.*.cashCollection")
    .if(body("officialReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("officialReceipts.*.cashCollection").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Amount is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Amount must only consist of 1 to 255 characters")
    .isNumeric()
    .withMessage("Amount must be a number"),
  body("officialReceipts.*.entries")
    .if(body("officialReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("officialReceipts.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .isArray()
    .withMessage("Entries must be an array")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Invalid entries");
      if (value.length < 1) throw new Error("Atleast 1 entry is required");
      return true;
    }),
  body("officialReceipts.*.entries.*.line")
    .if(body("officialReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("officialReceipts.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Line is required")
    .isNumeric()
    .withMessage("Line must be a number")
    .isFloat({ min: 1 })
    .withMessage("1 is the minimum for Line"),
  body("officialReceipts.*.entries.*.week")
    .if(body("officialReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("officialReceipts.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Week is required")
    .isNumeric()
    .withMessage("Week must be a number")
    .isFloat({ min: 1 })
    .withMessage("1 is the minimum for Week"),
  body("officialReceipts.*.entries.*.cvNo")
    .if(body("officialReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("officialReceipts.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("officialReceipts.*.entries.*.cvNo").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("CV# is required")
    .custom(async (value, { req, path }) => {
      const match = path.match(/officialReceipts\[(\d+)\]\.entries\[(\d+)\]\.clientLabel/);
      const receiptIndex = match[1];
      const entryIndex = match[2];
      const entries = req.body.officialReceipts[receiptIndex].entries;
      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const loanReleaseId = entries[entryIndex].loanReleaseId;
      const exists = await Transaction.exists({ _id: loanReleaseId, deletedAt: null });
      if (!exists) throw new Error("CV# not found / deleted");
      return true;
    }),
  body("officialReceipts.*.entries.*.dueDate")
    .if(body("officialReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("officialReceipts.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("officialReceipts.*.entries.*.dueDate").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Due Date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Due Date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Due Date must be a valid date (YYYY-MM-DD)"),
  body("officialReceipts.*.entries.*.name")
    .if(body("officialReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("officialReceipts.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("officialReceipts.*.entries.*.name").notEmpty())
    .custom(async (value, { req, path }) => {
      const match = path.match(/officialReceipts\[(\d+)\]\.entries\[(\d+)\]\.name/);
      const receiptIndex = match[1];
      const entryIndex = match[2];
      const entries = req.body.officialReceipts[receiptIndex].entries;
      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const clientId = entries[entryIndex].client;
      const exists = await Customer.exists({ _id: clientId, deletedAt: null });
      if (!exists) throw new Error("Client not found");
      return true;
    }),
  body("officialReceipts.*.entries.*.acctCode")
    .if(body("officialReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("officialReceipts.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Account code is required")
    .custom(async (value, { req, path }) => {
      const match = path.match(/officialReceipts\[(\d+)\]\.entries\[(\d+)\]\.acctCode/);
      const receiptIndex = match[1];
      const entryIndex = match[2];
      const entries = req.body.officialReceipts[receiptIndex].entries;
      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const acctCodeId = entries[entryIndex].acctCodeId;
      const exists = await ChartOfAccount.exists({ _id: acctCodeId, deletedAt: null });
      if (!exists) throw new Error("Account code not found / deleted");
      return true;
    }),
  body("officialReceipts.*.entries.*.debit")
    .if(body("officialReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("officialReceipts.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("officialReceipts.*.entries.*.debit").notEmpty())
    .isNumeric()
    .withMessage("Debit must be a number"),
  body("officialReceipts.*.entries.*.credit")
    .if(body("officialReceipts.*.action").custom(value => value === "update" || value === "create"))
    .if(body("officialReceipts.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("officialReceipts.*.entries.*.credit").notEmpty())
    .isNumeric()
    .withMessage("Credit must be a number"),
  body("root").custom(async (value, { req }) => {
    const officialReceipts = req.body.officialReceipts;

    let haveBankEntry = [];
    let haveDuplicateLines = [];
    let debitCreditBalanced = [];
    let netDebitCreditBalanced = [];
    let netAmountBalanced = [];

    await Promise.all(
      officialReceipts.map(async officialReceipt => {
        if (officialReceipt.action === "delete") return;
        const validated = await handleRootValidation(officialReceipt.entries, officialReceipt.amount);
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
