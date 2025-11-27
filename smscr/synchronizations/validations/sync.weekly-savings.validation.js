const { body } = require("express-validator");
const { isValidObjectId } = require("mongoose");

exports.weeklySavingRules = [
  body("weeklySavings")
    .isArray()
    .withMessage("Weekly Savings must be an array")
    .custom(data => {
      if (!Array.isArray(data)) throw new Error("Invalid offline changes");
      if (data.length < 1) throw new Error("There is no offline changes to be saved!");

      if (!data.every(weeklySaving => !weeklySaving._synced)) throw new Error("Please make sure that the weekly savings sent are not yet synced in the database.");

      if (!data.every(weeklySaving => weeklySaving.rangeAmountFrom)) throw new Error("Please make sure that the weekly savings fund sent must have a range amount from.");
      if (!data.every(weeklySaving => !isNaN(weeklySaving.rangeAmountFrom))) throw new Error("Please make sure that the weekly savings fund range amount from is number.");

      if (!data.every(weeklySaving => weeklySaving.rangeAmountTo)) throw new Error("Please make sure that the weekly savings fund sent must have a range amount to.");
      if (!data.every(weeklySaving => !isNaN(weeklySaving.rangeAmountTo))) throw new Error("Please make sure that the weekly savings fund range amount to is number.");

      if (!data.every(weeklySaving => weeklySaving.weeklySavingsFund)) throw new Error("Please make sure that the weekly savings fund sent must have a weekly savings fund.");
      if (!data.every(weeklySaving => !isNaN(weeklySaving.weeklySavingsFund))) throw new Error("Please make sure that the weekly savings fund is a number.");

      const toUpdate = data.filter(e => e.type === "update");
      const toDelete = data.filter(e => e.type === "delete");

      if (toUpdate.length > 0) {
        if (!toUpdate.every(weeklySaving => isValidObjectId(weeklySaving._id))) throw new Error("All weekly savings that needs to be updated must have a valid object id");
      }

      if (toDelete.length > 0) {
        if (!toDelete.every(weeklySaving => isValidObjectId(weeklySaving._id))) throw new Error("All banks that needs to be deleted must have a valid object id");
      }

      return true;
    }),
];
