const { body } = require("express-validator");
const { hasBankEntry } = require("../../../utils/bank-entry-checker");
const { hasDuplicateLines } = require("../../../utils/line-duplicate-checker");
const { isAmountTally } = require("../../../utils/tally-amount");
const EmergencyLoan = require("../../emergency-loan/emergency-loan.schema");
const Customer = require("../../customer/customer.schema");
const { isValidObjectId } = require("mongoose");
const Bank = require("../../banks/bank.schema");
const ChartOfAccount = require("../../chart-of-account/chart-of-account.schema");
const { isCodeUnique } = require("../../../utils/code-checker");

exports.emergencyLoansUploadRules = [
  body("emergencyLoans")
    .isArray()
    .withMessage("Emergency loans must be an array")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Emergency loans must be an array");
      if (value.length < 1) throw new Error("Atleast 1 emergency loan is required");
      if (!value.every(emergency => !emergency._synced)) throw new Error("Please make sure that the emergency loan sent are not yet synced in the database.");
      if (!value.every(emergency => emergency.action)) throw new Error("Please make sure that the emergency loan sent are have an action to make.");
      if (!value.every(emergency => ["create", "update", "delete"].includes(emergency.action)))
        throw new Error("An invalid action is found. Please make sure that the actions are only create, update and delete");

      return true;
    }),
  body("emergencyLoans.*._id")
    .if(body("emergencyLoans.*.action").custom(value => value === "update" || value === "delete"))
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
  body("emergencyLoans.*.code")
    .if(body("emergencyLoans.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("CV No is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("CV No must only consist of 1 to 255 characters")
    .matches(/^CV#[\d-]+$/i)
    .withMessage("CV# must start with CV# followed by numbers or hyphens"),
  body("emergencyLoans.*.code")
    .if(body("emergencyLoans.*.action").custom(value => value === "create"))
    .custom(async (value, { req }) => {
      const isUnique = await isCodeUnique(value);
      if (!isUnique) throw new Error("CV No. already exists");
      return true;
    }),
  body("emergencyLoans.*.code")
    .if(body("emergencyLoans.*.action").custom(value => value === "update"))
    .custom(async (value, { req, path }) => {
      const match = path.match(/emergencyLoans\[(\d+)\]\.code/);
      const index = match[1];
      const emergencyLoan = await EmergencyLoan.findById(req.body.emergencyLoans[index]._id).lean().exec();
      const newValue = emergencyLoan.code.toUpperCase().startsWith("CV#") ? emergencyLoan.code : `CV#${emergencyLoan.code}`;
      if (newValue.toUpperCase() !== value.toUpperCase()) {
        const isUnique = await isCodeUnique(value);
        if (!isUnique) throw new Error("CV No. already exists");
      }
      return true;
    }),
  body("emergencyLoans.*.clientLabel")
    .if(body("emergencyLoans.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Name must only contain 1 to 255 characters")
    .custom(async (value, { req, path }) => {
      const match = path.match(/emergencyLoans\[(\d+)\]\.clientLabel/);
      const index = match[1];
      const clientId = req.body.emergencyLoans[index].clientValue;
      if (!isValidObjectId(clientId)) throw new Error("Invalid client id");
      const exists = await Customer.exists({ _id: clientId, deletedAt: null });
      if (!exists) throw new Error("Client not found / deleted");
      return true;
    }),
  body("emergencyLoans.*.refNo")
    .if(body("emergencyLoans.*.action").custom(value => value === "update" || value === "create"))
    .if(body("emergencyLoans.*.refNo").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("Reference No. must only consist of 1 to 255 characters"),
  body("emergencyLoans.*.remarks")
    .if(body("emergencyLoans.*.action").custom(value => value === "update" || value === "create"))
    .if(body("emergencyLoans.*.remarks").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("Particular must only consist of 1 to 255 characters"),
  body("emergencyLoans.*.date")
    .if(body("emergencyLoans.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Date must be a valid date (YYYY-MM-DD)"),
  body("emergencyLoans.*.acctMonth")
    .if(body("emergencyLoans.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Account month is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Account month must only consist of 1 to 255 characters"),
  body("emergencyLoans.*.acctYear")
    .if(body("emergencyLoans.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Account year is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Account year must only consist of 1 to 255 characters"),
  body("emergencyLoans.*.checkNo")
    .if(body("emergencyLoans.*.action").custom(value => value === "update" || value === "create"))
    .if(body("emergencyLoans.*.checkNo").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Check no. is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check no. must only consist of 1 to 255 characters"),
  body("emergencyLoans.*.checkDate")
    .if(body("emergencyLoans.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Check date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Check date must be a valid date (YYYY-MM-DD)")
    .custom((value, { req, path }) => {
      const match = path.match(/emergencyLoans\[(\d+)\]\.checkDate/);
      const index = match[1];
      const date = req.body.emergencyLoans[index].date;
      const checkDate = value;
      if (date !== checkDate) throw Error("Date and Check Date must be the same");
      return true;
    }),
  body("emergencyLoans.*.bankCodeLabel")
    .if(body("emergencyLoans.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Bank code is required")
    .custom(async (value, { req, path }) => {
      const match = path.match(/emergencyLoans\[(\d+)\]\.bankCodeLabel/);
      const index = match[1];
      const bankId = req.body.emergencyLoans[index].bankCode;
      if (!bankId) throw new Error("Bank code is required");
      if (!isValidObjectId(bankId)) throw new Error("Invalid bank code");
      const exists = await Bank.exists({ _id: bankId, deletedAt: null });
      if (!exists) throw new Error("Invalid bank code id");
      return true;
    }),
  body("emergencyLoans.*.amount")
    .if(body("emergencyLoans.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Amount is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Amount must only consist of 1 to 255 characters")
    .isNumeric()
    .withMessage("Amount must be a number"),
  body("emergencyLoans.*.entries")
    .if(body("emergencyLoans.*.action").custom(value => value === "update" || value === "create"))
    .isArray()
    .withMessage("Entries must be an array")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Invalid entries");
      if (value.length < 1) throw new Error("Atleast 1 entry is required");
      return true;
    }),
  body("emergencyLoans.*.entries.*.line")
    .if(body("emergencyLoans.*.action").custom(value => value === "update" || value === "create"))
    .if(body("emergencyLoans.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Line is required")
    .isNumeric()
    .withMessage("Line must be a number")
    .isFloat({ min: 1 })
    .withMessage("1 is the minimum for Line"),
  body("emergencyLoans.*.entries.*.clientLabel")
    .if(body("emergencyLoans.*.action").custom(value => value === "update" || value === "create"))
    .if(body("emergencyLoans.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("emergencyLoans.*.entries.*.clientLabel").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Name must only contain 1 to 255 characters")
    .custom(async (value, { req, path }) => {
      const match = path.match(/emergencyLoans\[(\d+)\]\.entries\[(\d+)\]\.clientLabel/);
      const emergencyIndex = match[1];
      const entryIndex = match[2];
      const entries = req.body.emergencyLoans[emergencyIndex].entries;
      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const clientId = entries[entryIndex].client;
      const exists = await Customer.exists({ _id: clientId, deletedAt: null });
      if (!exists) throw new Error("Client not found / deleted");
      return true;
    }),
  body("emergencyLoans.*.entries.*.acctCode")
    .if(body("emergencyLoans.*.action").custom(value => value === "update" || value === "create"))
    .if(body("emergencyLoans.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Account code is required")
    .custom(async (value, { req, path }) => {
      const match = path.match(/emergencyLoans\[(\d+)\]\.entries\[(\d+)\]\.acctCode/);
      const emergencyIndex = match[1];
      const entryIndex = match[2];
      const entries = req.body.emergencyLoans[emergencyIndex].entries;
      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const acctCodeId = entries[entryIndex].acctCodeId;
      const exists = await ChartOfAccount.exists({ _id: acctCodeId, deletedAt: null });
      if (!exists) throw new Error("Account code not found / deleted");
      return true;
    }),
  body("emergencyLoans.*.entries.*.debit")
    .if(body("emergencyLoans.*.action").custom(value => value === "update" || value === "create"))
    .if(body("emergencyLoans.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Debit is required")
    .isNumeric()
    .withMessage("Debit must be a number"),
  body("emergencyLoans.*.entries.*.credit")
    .if(body("emergencyLoans.*.action").custom(value => value === "update" || value === "create"))
    .if(body("emergencyLoans.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Credit is required")
    .isNumeric()
    .withMessage("Credit must be a number"),
  body("root").custom(async (value, { req }) => {
    const emergencyLoans = req.body.emergencyLoans;

    let haveBankEntry = [];
    let haveDuplicateLines = [];
    let debitCreditBalanced = [];
    let netDebitCreditBalanced = [];
    let netAmountBalanced = [];

    await Promise.all(
      emergencyLoans.map(async emergencyLoan => {
        if (emergencyLoan.action === "delete") return;
        const validated = await handleRootValidation(emergencyLoan.entries, emergencyLoan.amount);
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
