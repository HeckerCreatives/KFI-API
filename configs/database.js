const mongoose = require("mongoose");
const User = require("../smscr/user/user.schema");
const { su } = require("../constants/roles");
const { initializeChartOfAccount } = require("../utils/initialize-chart-of-account");
const ChartOfAccount = require("../smscr/chart-of-account/chart-of-account.schema");
const WeeklySaving = require("../smscr/weekly-saving/weekly-saving.schema");
const { initializeWeeklySavings } = require("../utils/initialize-weely-savings");
const LoanReleaseEntryParam = require("../smscr/system-parameters/loan-release-entry-param.schema");
const { lrParameterCodes } = require("../constants/lr-load-parameters");
const { initializeLoanReleaseEntryParams } = require("../utils/initialize-lr-entry-params");
const SignatureParam = require("../smscr/system-parameters/signature-param");
const { initializeSignatureParams } = require("../utils/initialize-signature-param");

exports.database = () => {
  mongoose.set("strictQuery", true);
  mongoose.connect(process.env.ATLAS_URI, {});
  mongoose.connection.once("open", async () => {
    const charOfAccountsPromise = ChartOfAccount.countDocuments();
    const weeklySavingsPromise = WeeklySaving.countDocuments();
    const suPromise = User.exists({ role: su, deletedAt: null });
    const lrEntriesPromise = LoanReleaseEntryParam.countDocuments({ code: { $in: [...lrParameterCodes.map(code => code.code)] } });
    const signatureParamsPromise = SignatureParam.countDocuments();

    const [chartOfAccounts, weeklySavings, suExists, lrEntries, signatureParams] = await Promise.all([
      charOfAccountsPromise,
      weeklySavingsPromise,
      suPromise,
      lrEntriesPromise,
      signatureParamsPromise,
    ]);

    if (chartOfAccounts < 1) {
      await initializeChartOfAccount();
      await initializeLoanReleaseEntryParams();
    } else {
      if (lrEntries < 1) await initializeLoanReleaseEntryParams();
    }

    if (weeklySavings < 1) await initializeWeeklySavings();
    if (signatureParams < 1) await initializeSignatureParams();

    if (!suExists) {
      const superadmin = new User({
        name: "Super Admin",
        username: process.env.SU_USERNAME,
        password: process.env.SU_PASSWORD,
        role: su,
      });
      await superadmin.savePassword(process.env.SU_PASSWORD);
      await superadmin.save();
    }
    console.log("connection to database has been established.");
  });
};
