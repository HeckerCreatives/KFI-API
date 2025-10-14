const { bankCodes } = require("../constants/bank-codes");

exports.isAmountTally = (entries, amount) => {
  let totalDebit = 0;
  let totalCredit = 0;
  let totalDeduction = 0;
  let totalBank = 0;

  let haveBankEntry = false;

  entries.map(entry => {
    const acctCode = entry?.acctCode?.code ? entry.acctCode.code : entry.acctCode;

    totalDebit += Number(entry.debit);
    totalCredit += Number(entry.credit);
    if (!bankCodes.includes(acctCode)) totalDeduction += Number(entry.credit);
    if (bankCodes.includes(acctCode)) {
      totalBank += Number(entry.credit);
      haveBankEntry = true;
    }
  });

  const netLoanCredit = totalCredit - totalDeduction;
  const netLoanDebit = totalDebit - totalDeduction;

  const debitCreditBalanced = totalDebit === totalCredit;
  const netDebitCreditBalanced = netLoanCredit === netLoanDebit;
  let netAmountBalanced = false;

  if (haveBankEntry) {
    netAmountBalanced = totalBank === amount;
  } else {
    netAmountBalanced = totalCredit === amount;
  }

  return { debitCreditBalanced, netDebitCreditBalanced, netAmountBalanced };
};
