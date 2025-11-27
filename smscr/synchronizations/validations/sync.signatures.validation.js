const { body } = require("express-validator");
const { isValidObjectId } = require("mongoose");

exports.uploadSignaturesRules = [
  body("signatures")
    .isArray()
    .withMessage("System Parameters must be an array")
    .custom(async data => {
      if (!Array.isArray(data)) throw new Error("Invalid offline changes");
      if (data.length < 1) throw new Error("There is no offline changes to be saved!");

      if (!data.every(signature => !signature._synced)) throw new Error("Please make sure that the system parameters sent are not yet synced in the database.");
      if (!data.every(signature => signature.approvedBy)) throw new Error("Please make sure that the signatures sent must have a approved by.");
      if (!data.every(signature => signature.checkedBy)) throw new Error("Please make sure that the signatures sent must have a checked by.");
      if (!data.every(signature => signature.type)) throw new Error("Please make sure that the signatures sent must have a type.");

      const toUpdate = data.filter(e => e.action === "update");

      if (toUpdate.length > 0) {
        if (!toUpdate.every(bank => isValidObjectId(bank._id))) throw new Error("All banks that needs to be updated must have a valid object id");
      }

      return true;
    }),
];
