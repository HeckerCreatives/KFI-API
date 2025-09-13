const { bankCodes } = require("../constants/bank-codes");
const ChartOfAccount = require("../smscr/chart-of-account/chart-of-account.schema");

exports.hasBankEntry = async entries => {
  const ids = entries.map(entry => entry.acctCodeId);
  const currentEntries = await ChartOfAccount.find({ _id: { $in: ids }, deletedAt: null })
    .lean()
    .exec();

  let haveBankEntry = false;
  const codes = currentEntries.map(entry => entry.code);

  codes.map(code => {
    if (bankCodes.includes(code)) haveBankEntry = true;
  });

  return haveBankEntry;
};
