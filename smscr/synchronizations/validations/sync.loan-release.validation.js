const { body } = require("express-validator");
const { hasBankEntry } = require("../../../utils/bank-entry-checker");
const { isCodeUnique } = require("../../../utils/code-checker");
const Transaction = require("../../transactions/transaction.schema");
const Center = require("../../center/center.schema");
const Loan = require("../../loan/loan.schema");
const Bank = require("../../banks/bank.schema");
const { hasDuplicateLines } = require("../../../utils/line-duplicate-checker");
const { isAmountTally } = require("../../../utils/tally-amount");
const ChartOfAccount = require("../../chart-of-account/chart-of-account.schema");
const Customer = require("../../customer/customer.schema");
const Entry = require("../../transactions/entries/entry.schema");

exports.loanReleaseUploadRules = [
  body("loanReleases")
    .isArray()
    .withMessage("Loan Releases must be an array")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Loan Releases must be an array");
      if (value.length < 1) throw new Error("Atleast 1 loan release is required");
      if (!value.every(loanRelease => !loanRelease._synced)) throw new Error("Please make sure that the loan releases sent are not yet synced in the database.");
      if (!value.every(loanRelease => loanRelease.action)) throw new Error("Please make sure that the loan releases sent are have an action to make.");
      if (!value.every(loanRelease => ["create", "update", "delete"].includes(loanRelease.action)))
        throw new Error("An invalid action is found. Please make sure that the actions are only create, update and delete");

      return true;
    }),
  body("loanReleases.*._id")
    .if(body("loanReleases.*.action").custom(value => value === "update" || value === "delete"))
    .trim()
    .notEmpty()
    .withMessage("Loan Release id is required for updates and deletions")
    .isMongoId()
    .withMessage("An invalid loan release id exists in the array for update/delete. Please check if send ids are valid.")
    .custom(async value => {
      const exists = await Transaction.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("A loan release for update/delete is not found / deleted already.");
      return true;
    }),
  body("loanReleases.*.code")
    .if(body("loanReleases.*.action").custom(value => value === "create"))
    .trim()
    .notEmpty()
    .withMessage("CV No. is required")
    .custom(async value => {
      const isUnique = await isCodeUnique(value);
      if (!isUnique) throw new Error("CV No. already exists");
      return true;
    })
    .matches(/^CV#[\d-]+$/i)
    .withMessage("CV# must start with CV# followed by numbers or hyphens"),
  body("loanReleases.*.center")
    .if(body("loanReleases.*.action").custom(value => value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Center code is required")
    .isMongoId()
    .withMessage("Invalid center code")
    .custom(async value => {
      const exists = await Center.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Center not found");
      return true;
    }),
  body("loanReleases.*.refNo")
    .if(body("loanReleases.*.action").custom(value => value === "create"))
    .if(body("refNumber").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("Reference number must only consist of 1 to 255 characters"),
  body("loanReleases.*.remarks")
    .if(body("loanReleases.*.action").custom(value => value === "create"))
    .if(body("remarks").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("Particular must only consist of 1 to 255 characters"),
  body("loanReleases.*.date")
    .if(body("loanReleases.*.action").custom(value => value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Date must be a valid date (YYYY-MM-DD)"),
  body("loanReleases.*.acctMonth")
    .if(body("loanReleases.*.action").custom(value => value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Account Month is required")
    .isNumeric()
    .withMessage("Account Month must be a number"),
  body("loanReleases.*.acctYear")
    .if(body("loanReleases.*.action").custom(value => value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Account Year is required")
    .isNumeric()
    .withMessage("Account Year must be a number"),
  body("loanReleases.*.noOfWeeks")
    .if(body("loanReleases.*.action").custom(value => value === "create"))
    .trim()
    .notEmpty()
    .withMessage("No. of weeks is required")
    .isNumeric()
    .withMessage("No. of weeks must be a number"),
  body("loanReleases.*.loan")
    .if(body("loanReleases.*.action").custom(value => value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Type of Loan is  required")
    .isMongoId()
    .withMessage("Type of loan is required")
    .custom(async value => {
      const exists = await Loan.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Type of loan not found");
      return true;
    }),
  body("loanReleases.*.checkNo")
    .if(body("loanReleases.*.action").custom(value => value === "create"))
    .if(body("checkNo").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Check No. is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check No. must only contain 1 to 255 characters"),
  body("loanReleases.*.checkDate")
    .if(body("loanReleases.*.action").custom(value => value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Check date is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Check date must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Check date must be a valid date (YYYY-MM-DD)")
    .custom((value, { req, path }) => {
      const index = path.match(/loanReleases\[(\d+)\]\.checkDate/)[1];
      const loanReleases = req.body.loanReleases;
      const date = loanReleases[index].date;
      const checkDate = value;
      if (date !== checkDate) throw Error("Date and Check Date must be the same");
      return true;
    }),
  body("loanReleases.*.bank")
    .if(body("loanReleases.*.action").custom(value => value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Bank Code is required")
    .isMongoId()
    .withMessage("Invalid bank code")
    .custom(async value => {
      const exists = await Bank.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Bank code not found");
      return true;
    }),
  body("loanReleases.*.amount")
    .if(body("loanReleases.*.action").custom(value => value === "create" || value === "update"))
    .trim()
    .notEmpty()
    .withMessage("Amount is required")
    .isNumeric()
    .withMessage("Amount must be a number"),
  body("loanReleases.*.cycle")
    .if(body("loanReleases.*.action").custom(value => value === "create" || value === "update"))
    .if(body("cycle").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Cycle is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Cycle must only consist of 1 to 255 characters"),
  body("loanReleases.*.interest")
    .if(body("loanReleases.*.action").custom(value => value === "create" || value === "update"))
    .trim()
    .notEmpty()
    .withMessage("Interest rate is required")
    .isNumeric()
    .withMessage("Interest rate must be a number"),
  body("loanReleases.*.entries")
    .isArray()
    .withMessage("Entries must be an array")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Invalid entries");
      if (value.length < 1) throw new Error("Atleast 1 entry is required");
      if (!value.every(e => !e._synced)) throw new Error("Please make sure that all the entries sent are not yet synced to the database.");
      if (!value.every(e => e.action)) throw new Error("Please make sure that all the entrues sent have an action.");
      if (!value.every(e => ["create", "update", "delete", "retain"].includes(e.action)))
        throw new Error("An invalid action is found. Please make sure that the actions are only create, update and delete");
      return true;
    }),
  body("loanReleases.*.entries.*._id")
    .if(body("loanReleases.*.entries.*.action").custom(value => value === "update" || value === "delete"))
    .trim()
    .notEmpty()
    .withMessage("Entry id is required")
    .isMongoId()
    .withMessage("Invalid entry id")
    .custom(async (value, { req, path }) => {
      const loanRelease = req.body.loanReleases.find(lr => lr.entries && lr.entries.some(entry => entry._id === value));
      if (!loanRelease || !loanRelease._id) throw new Error("Corresponding loan release not found for this entry");

      const exists = await Entry.exists({ _id: value, transaction: loanRelease._id, deletedAt: null });
      if (!exists) throw new Error("An entry for update/delete is not found or already deleted. Please check and try again.");
      return true;
    }),
  body("loanReleases.*.entries.*.line")
    .if(body("loanReleases.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .trim()
    .notEmpty()
    .withMessage("Line is required")
    .isNumeric()
    .withMessage("Line must be a number")
    .isFloat({ min: 1 })
    .withMessage("1 is the minimum for Line"),
  body("loanReleases.*.entries.*.client")
    .if(body("loanReleases.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("loanReleases.*.entries.*.client").notEmpty())
    .isMongoId()
    .withMessage("Invalid client id")
    .custom(async value => {
      const exists = await Customer.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Client not found");
      return true;
    }),
  body("loanReleases.*.entries.*.particular")
    .if(body("loanReleases.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("loanReleases.*.entries.*.particular").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("Particular must only contain 1 to 255 characters"),
  body("loanReleases.*.entries.*.acctCodeId")
    .if(body("loanReleases.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .isMongoId()
    .withMessage("Invalid account code")
    .custom(async value => {
      const exists = await ChartOfAccount.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Account code not found");
      return true;
    }),
  body("loanReleases.*.entries.*.debit")
    .if(body("loanReleases.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("loanReleases.*.entries.*.debit").notEmpty())
    .isNumeric()
    .withMessage("Debit must be a number"),
  body("loanReleases.*.entries.*.credit")
    .if(body("loanReleases.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("loanReleases.*.entries.*.credit").notEmpty())
    .isNumeric()
    .withMessage("Credit must be a number"),
  body("loanReleases.*.entries.*.interest")
    .if(body("loanReleases.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("loanReleases.*.entries.*.interest").notEmpty())
    .isNumeric()
    .withMessage("Interest must be a number"),
  body("loanReleases.*.entries.*.cycle")
    .if(body("loanReleases.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("loanReleases.*.entries.*.cycle").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("Cycle must only consist of 1 to 255 characters"),
  body("loanReleases.*.entries.*.checkNo")
    .if(body("loanReleases.*.entries.*.action").custom(value => value === "update" || value === "create"))
    .if(body("loanReleases.*.entries.*.checkNo").notEmpty())
    .isLength({ min: 1, max: 255 })
    .withMessage("Check no. must only contain 1 to 255 characters"),
  body("root").custom(async (value, { req }) => {
    const loanReleases = req.body.loanReleases;

    let haveBankEntry = [];
    let haveDuplicateLines = [];
    let debitCreditBalanced = [];
    let netDebitCreditBalanced = [];
    let netAmountBalanced = [];

    await Promise.all(
      loanReleases.map(async loanRelease => {
        if (loanRelease.action === "delete") return;
        const validated = await handleRootValidation(loanRelease.entries, loanRelease.amount);
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
