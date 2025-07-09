const Acknowledgement = require("../smscr/acknowledgement/acknowlegement.schema.js");
const DamayanFund = require("../smscr/damayan-fund/damayan-fund.schema.js");
const EmergencyLoan = require("../smscr/emergency-loan/emergency-loan.schema.js");
const ExpenseVoucher = require("../smscr/expense-voucher/expense-voucher.schema.js");
const JournalVoucher = require("../smscr/journal-voucher/journal-voucher.schema.js");
const Release = require("../smscr/release/release.schema.js");
const Transaction = require("../smscr/transactions/transaction.schema.js");

exports.isCodeUnique = async value => {
  const transactionExistsPromise = Transaction.exists({ code: value.toUpperCase(), deletedAt: null });
  const expenseVoucherExistsPromise = ExpenseVoucher.exists({ code: value.toUpperCase(), deletedAt: null });
  const journalVoucherExistsPromise = JournalVoucher.exists({ code: value.toUpperCase(), deletedAt: null });
  const emergencyLoanExistsPromise = EmergencyLoan.exists({ code: value.toUpperCase(), deletedAt: null });
  const damayanFundExistsPromise = DamayanFund.exists({ code: value.toUpperCase(), deletedAt: null });
  const acknowledgementExistsPromise = Acknowledgement.exists({ code: value.toUpperCase(), deletedAt: null });
  const releaseExistsPromise = Release.exists({ code: value.toUpperCase(), deletedAt: null });

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
