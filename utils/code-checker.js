const Acknowledgement = require("../smscr/acknowledgement/acknowlegement.schema");
const DamayanFund = require("../smscr/damayan-fund/damayan-fund.schema");
const EmergencyLoan = require("../smscr/emergency-loan/emergency-loan.schema");
const ExpenseVoucher = require("../smscr/expense-voucher/expense-voucher.schema");
const JournalVoucher = require("../smscr/journal-voucher/journal-voucher.schema");
const Transaction = require("../smscr/transactions/transaction.schema");

exports.isCodeUnique = async value => {
  const transactionExistsPromise = Transaction.exists({ code: value.toUpperCase(), deletedAt: null });
  const expenseVoucherExistsPromise = ExpenseVoucher.exists({ code: value.toUpperCase(), deletedAt: null });
  const journalVoucherExistsPromise = JournalVoucher.exists({ code: value.toUpperCase(), deletedAt: null });
  const emergencyLoanExistsPromise = EmergencyLoan.exists({ code: value.toUpperCase(), deletedAt: null });
  const damayanFundExistsPromise = DamayanFund.exists({ code: value.toUpperCase(), deletedAt: null });
  const acknowledgementExistsPromise = Acknowledgement.exists({ code: value.toUpperCase(), deletedAt: null });

  const [transaction, expense, journal, emergency, damayan, acknowledgement] = await Promise.all([
    transactionExistsPromise,
    expenseVoucherExistsPromise,
    journalVoucherExistsPromise,
    emergencyLoanExistsPromise,
    damayanFundExistsPromise,
    acknowledgementExistsPromise,
  ]);

  if (transaction || expense || journal || emergency || damayan || acknowledgement) return false;

  return true;
};
