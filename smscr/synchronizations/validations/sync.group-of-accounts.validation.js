const { body } = require("express-validator");

exports.groupAccountsUploadRules = [
  body("groupAccounts")
    .isArray()
    .withMessage("Group of account must be an array")
    .custom(async data => {
      if (!Array.isArray(data)) throw new Error("Invalid offline changes");
      if (data.length < 1) throw new Error("There is no offline changes to be saved!");

      if (!data.every(groupAccount => !groupAccount._synced)) throw new Error("Please make sure that the group of account sent are not yet synced in the database.");
      if (!data.every(groupAccount => groupAccount.code)) throw new Error("Please make sure that the group of account sent must have a code.");

      const toUpdate = data.filter(e => e.type === "update");
      const toDelete = data.filter(e => e.type === "delete");

      if (toUpdate.length > 0) {
        if (!toUpdate.every(bank => bank._id)) throw new Error("All banks that needs to be updated must have a valid object id");
      }

      if (toDelete.length > 0) {
        if (!toUpdate.every(bank => bank._id)) throw new Error("All banks that needs to be deleted must have a valid object id");
      }

      return true;
    }),
];
