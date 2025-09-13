const { lrParameterCodes } = require("../constants/lr-load-parameters");
const ChartOfAccount = require("../smscr/chart-of-account/chart-of-account.schema");
const LoanReleaseEntryParam = require("../smscr/system-parameters/loan-release-entry-param.schema");

exports.initializeLoanReleaseEntryParams = async () => {
  const codes = [...lrParameterCodes.map(code => code.code)];
  const params = await ChartOfAccount.find({ code: { $in: codes } })
    .lean()
    .exec();

  if (params.length !== lrParameterCodes.length) {
    console.error("Failed to initialize loan release enry parameters");
    process.exit(1);
  }

  const parameters = lrParameterCodes.map((code, i) => {
    const entryCode = params.find(e => e.code === code.code);
    const accountCode = entryCode._id;
    const label = code.label;
    const sort = i + 1;

    return { code: code.code, label, accountCode, sort };
  });

  await LoanReleaseEntryParam.insertMany(parameters);
};
