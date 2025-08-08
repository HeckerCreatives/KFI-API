const Acknowledgement = require("../smscr/acknowledgement/acknowlegement.schema.js");
const DamayanFund = require("../smscr/damayan-fund/damayan-fund.schema.js");
const EmergencyLoan = require("../smscr/emergency-loan/emergency-loan.schema.js");
const ExpenseVoucher = require("../smscr/expense-voucher/expense-voucher.schema.js");
const JournalVoucher = require("../smscr/journal-voucher/journal-voucher.schema.js");
const Release = require("../smscr/release/release.schema.js");
const Transaction = require("../smscr/transactions/transaction.schema.js");

const units = ["CV#", "JV#", "OR#", "AR#"];

const removeUnitPrefix = value => {
  for (const unit of units) {
    if (value.toUpperCase().startsWith(unit)) {
      return value.slice(unit.length); // Remove the unit prefix
    }
  }
  return value;
};

exports.isCodeUnique = async code => {
  const value = removeUnitPrefix(code);

  const filter = { code: new RegExp(`^(CV|JV|OR|AR)#${value}$`), deletedAt: null };

  const transactionExistsPromise = Transaction.exists(filter);
  const expenseVoucherExistsPromise = ExpenseVoucher.exists(filter);
  const journalVoucherExistsPromise = JournalVoucher.exists(filter);
  const emergencyLoanExistsPromise = EmergencyLoan.exists(filter);
  const damayanFundExistsPromise = DamayanFund.exists(filter);
  const acknowledgementExistsPromise = Acknowledgement.exists(filter);
  const releaseExistsPromise = Release.exists(filter);

  const [transaction, expense, journal, emergency, damayan, acknowledgement, release] = await Promise.all([
    transactionExistsPromise,
    expenseVoucherExistsPromise,
    journalVoucherExistsPromise,
    emergencyLoanExistsPromise,
    damayanFundExistsPromise,
    acknowledgementExistsPromise,
    releaseExistsPromise,
  ]);

  if (transaction || expense || journal || emergency || damayan || acknowledgement || release) return false;

  return true;
};
