const { body } = require("express-validator");
const { isValidObjectId } = require("mongoose");
const ChartOfAccount = require("../../chart-of-account/chart-of-account.schema");
const GroupAccount = require("../../group-account/group-account.schema");

exports.chartAccountsUploadRules = [
  body("chartAccounts")
    .isArray()
    .withMessage("Chart Of Accounts must be an array")
    .custom(async data => {
      if (!Array.isArray(data)) throw new Error("Invalid offline changes");
      if (data.length < 1) throw new Error("There is no offline changes to be saved!");

      if (!data.every(chartAccount => !chartAccount._synced)) throw new Error("Please make sure that the chart of accounts sent are not yet synced in the database.");

      const toUpdate = data.filter(e => e.action === "update");

      if (toUpdate.length > 0) {
        if (!toUpdate.every(chartAccount => isValidObjectId(chartAccount._id))) throw new Error("All chart of accounts that needs to be updated must have a valid object id");
        if (!toUpdate.every(chartAccount => isValidObjectId(chartAccount.groupOfAccount._id)))
          throw new Error("All group of accounts that needs to be linked must have a valid object id");

        const chartAccountIds = toUpdate.map(e => e._id);
        const groupAccountIds = toUpdate.map(e => e.groupOfAccount._id);

        const [chartAccountCount, groupAccountCount] = await Promise.all([
          ChartOfAccount.countDocuments({ _id: { $in: chartAccountIds }, deletedAt: null }),
          GroupAccount.countDocuments({ _id: { $in: groupAccountIds }, deletedAt: null }),
        ]);

        if (chartAccountIds.length !== chartAccountCount) throw new Error("A chart of account is not found / deleted.");
        if (groupAccountIds.length !== groupAccountCount) throw new Error("A group of account is not found / deleted.");
      }

      return true;
    }),
];
