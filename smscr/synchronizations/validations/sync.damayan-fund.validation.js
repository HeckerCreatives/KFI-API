const { body } = require("express-validator");
const { hasBankEntry } = require("../../../utils/bank-entry-checker");
const { hasDuplicateLines } = require("../../../utils/line-duplicate-checker");
const { isAmountTally } = require("../../../utils/tally-amount");
const { isCodeUnique } = require("../../../utils/code-checker");
const DamayanFund = require("../../damayan-fund/damayan-fund.schema");
const Center = require("../../center/center.schema");
const Bank = require("../../banks/bank.schema");
const Customer = require("../../customer/customer.schema");
const ChartOfAccount = require("../../chart-of-account/chart-of-account.schema");
const { isValidObjectId } = require("mongoose");

exports.damayanFundsUploadRules = [
  body("damayanFunds")
    .isArray()
    .withMessage("Damayan funds must be an array")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Damayan funds must be an array");
      if (value.length < 1) throw new Error("Atleast 1 damayan fund is required");
      if (!value.every(damayan => !damayan._synced)) throw new Error("Please make sure that the damayan fund sent are not yet synced in the database.");
      if (!value.every(damayan => damayan.action)) throw new Error("Please make sure that the damayan fund sent are have an action to make.");
      if (!value.every(damayan => ["create", "update", "delete"].includes(damayan.action)))
        throw new Error("An invalid action is found. Please make sure that the actions are only create, update and delete");

      return true;
    }),
  body("damayanFunds.*._id")
    .if(body("damayanFunds.*.action").custom(value => value === "update" || value === "delete"))
    .trim()
    .notEmpty()
    .withMessage("Damayan fund id is required")
    .isMongoId()
    .withMessage("Invalid damayan fund id")
    .custom(async value => {
      const exists = await DamayanFund.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Damayan fund not found");
      return true;
    }),
  body("damayanFunds.*.code")
    .if(body("damayanFunds.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("JV No is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("JV No must only consist of 1 to 255 characters")
    .matches(/^(JV|CV)#[\d-]+$/i)
    .withMessage("Must be CV# or JV# followed by numbers or hyphens"),
  body("damayanFunds.*.code")
    .if(body("damayanFunds.*.action").custom(value => value === "create"))
    .custom(async (value, { req }) => {
      const isUnique = await isCodeUnique(value);
      if (!isUnique) throw new Error("JV No. already exists");
      return true;
    }),
  body("damayanFunds.*.code")
    .if(body("damayanFunds.*.action").custom(value => value === "update"))
    .custom(async (value, { req, path }) => {
      const match = path.match(/damayanFunds\[(\d+)\]\.code/);
      const index = match[1];
      const damayanFund = await DamayanFund.findById(req.body.damayanFunds[index]._id).lean().exec();
      const isJV = damayanFund.code.toUpperCase().startsWith("JV#");
      const isCV = damayanFund.code.toUpperCase().startsWith("CV#");
      const newValue = isJV || isCV ? damayanFund.code : `${isJV ? "JV#" : "CV#"}${damayanFund.code}`;

      if (newValue.toUpperCase() !== value.toUpperCase()) {
        const isUnique = await isCodeUnique(value);
        if (!isUnique) throw new Error("JV No. / CV No. already exists");
      }
      return true;
    }),
  body("damayanFunds.*.centerLabel")
    .if(body("damayanFunds.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Center is required")
    .custom(async (value, { req, path }) => {
      const match = path.match(/damayanFunds\[(\d+)\]\.centerLabel/);
      const index = match[1];
      const centerId = req.body.damayanFunds[index].center;
      if (!isValidObjectId(centerId)) throw new Error("Invalid center");
      const exists = await Center.exists({ _id: centerId, deletedAt: null });
      if (!exists) throw new Error("Center not found");
      return true;
    }),
  body("damayanFunds.*.nature")
    .if(body("damayanFunds.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Nature is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Nature must consist of only 1 to 255 characters."),
  body("damayanFunds.*.name")
    .if(body("damayanFunds.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Name must consist of only 1 to 255 characters."),
  body("damayanFunds.*.refNo")
    .if(body("damayanFunds.*.action").custom(value => value === "update" || value === "create"))
    .if(body("damayanFunds.*.refNo").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("Reference No. must only consist of 1 to 255 characters"),
  body("damayanFunds.*.remarks")
    .if(body("damayanFunds.*.action").custom(value => value === "update" || value === "create"))
    .if(body("damayanFunds.*.remarks").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("Particular must only consist of 1 to 255 characters"),
  body("damayanFunds.*.date")
    .if(body("damayanFunds.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Date must be a valid date (YYYY-MM-DD)"),
  body("damayanFunds.*.acctMonth")
    .if(body("damayanFunds.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Account month is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Account month must only consist of 1 to 255 characters"),
  body("damayanFunds.*.acctYear")
    .if(body("damayanFunds.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Account year is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Account year must only consist of 1 to 255 characters"),
  body("damayanFunds.*.checkNo")
    .if(body("damayanFunds.*.action").custom(value => value === "update" || value === "create"))
    .if(body("damayanFunds.*.checkNo").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Check no. is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check no. must only consist of 1 to 255 characters"),
  body("damayanFunds.*.checkDate")
    .if(body("damayanFunds.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Check date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Check date must be a valid date (YYYY-MM-DD)")
    .custom((value, { req, path }) => {
      const match = path.match(/damayanFunds\[(\d+)\]\.checkDate/);
      const index = match[1];
      const date = req.body.damayanFunds[index].date;
      const checkDate = value;
      if (date !== checkDate) throw Error("Date and Check Date must be the same");
      return true;
    }),
  body("damayanFunds.*.bankCodeLabel")
    .if(body("damayanFunds.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Bank code is required")
    .custom(async (value, { req, path }) => {
      const match = path.match(/damayanFunds\[(\d+)\]\.bankCodeLabel/);
      const index = match[1];
      const bankId = req.body.damayanFunds[index].bankCode;
      if (!bankId) throw new Error("Bank code is required");
      if (!isValidObjectId(bankId)) throw new Error("Invalid bank code");
      const exists = await Bank.exists({ _id: bankId, deletedAt: null });
      if (!exists) throw new Error("Invalid bank code id");
      return true;
    }),
  body("damayanFunds.*.amount")
    .if(body("damayanFunds.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Amount is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Amount must only consist of 1 to 255 characters")
    .isNumeric()
    .withMessage("Amount must be a number"),
  body("damayanFunds.*.entries")
    .if(body("damayanFunds.*.action").custom(value => value === "update" || value === "create"))
    .isArray()
    .withMessage("Entries must be an array")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Invalid entries");
      if (value.length < 1) throw new Error("Atleast 1 entry is required");
      return true;
    }),
  body("damayanFunds.*.entries.*.line")
    .if(body("damayanFunds.*.action").custom(value => value === "update" || value === "create"))
    .if(body("damayanFunds.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Line is required")
    .isNumeric()
    .withMessage("Line must be a number")
    .isFloat({ min: 1 })
    .withMessage("1 is the minimum for Line"),
  body("damayanFunds.*.entries.*.particular")
    .if(body("damayanFunds.*.action").custom(value => value === "update" || value === "create"))
    .if(body("damayanFunds.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("damayanFunds.*.entries.*.particular").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("Particular must only contain 1 to 255 characters"),
  body("damayanFunds.*.entries.*.clientLabel")
    .if(body("damayanFunds.*.action").custom(value => value === "update" || value === "create"))
    .if(body("damayanFunds.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("damayanFunds.*.entries.*.clientLabel").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Name must only contain 1 to 255 characters")
    .custom(async (value, { req, path }) => {
      const match = path.match(/damayanFunds\[(\d+)\]\.entries\[(\d+)\]\.clientLabel/);
      const damayanIndex = match[1];
      const entryIndex = match[2];
      const entries = req.body.damayanFunds[damayanIndex].entries;
      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const clientId = entries[entryIndex].client;
      const exists = await Customer.exists({ _id: clientId, deletedAt: null });
      if (!exists) throw new Error("Client not found / deleted");
      return true;
    }),
  body("damayanFunds.*.entries.*.acctCodeLabel")
    .if(body("damayanFunds.*.action").custom(value => value === "update" || value === "create"))
    .if(body("damayanFunds.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Account code is required")
    .custom(async (value, { req, path }) => {
      const match = path.match(/damayanFunds\[(\d+)\]\.entries\[(\d+)\]\.acctCodeLabel/);
      const damayanIndex = match[1];
      const entryIndex = match[2];
      const entries = req.body.damayanFunds[damayanIndex].entries;
      if (!Array.isArray(entries)) throw new Error("Invalid entries");
      const acctCodeId = entries[entryIndex].acctCodeId;
      const exists = await ChartOfAccount.exists({ _id: acctCodeId, deletedAt: null });
      if (!exists) throw new Error("Account code not found / deleted");
      return true;
    }),
  body("damayanFunds.*.entries.*.debit")
    .if(body("damayanFunds.*.action").custom(value => value === "update" || value === "create"))
    .if(body("damayanFunds.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Debit is rquired")
    .isNumeric()
    .withMessage("Debit must be a number"),
  body("damayanFunds.*.entries.*.credit")
    .if(body("damayanFunds.*.action").custom(value => value === "update" || value === "create"))
    .if(body("damayanFunds.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Debit is rquired")
    .isNumeric()
    .withMessage("Credit must be a number"),
  body("root").custom(async (value, { req }) => {
    const damayanFunds = req.body.damayanFunds;

    let haveBankEntry = [];
    let haveDuplicateLines = [];
    let debitCreditBalanced = [];
    let netDebitCreditBalanced = [];
    let netAmountBalanced = [];

    await Promise.all(
      damayanFunds.map(async damayanFund => {
        if (damayanFund.action === "delete") return;
        const validated = await handleRootValidation(damayanFund.entries, damayanFund.amount);
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
