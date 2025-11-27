const { body } = require("express-validator");
const { isValidObjectId } = require("mongoose");

exports.businessTypesUploadRules = [
  body("businessTypes")
    .isArray()
    .withMessage("Business types must be an array")
    .custom(data => {
      if (!Array.isArray(data)) throw new Error("Invalid offline changes");
      if (data.length < 1) throw new Error("There is no offline changes to be saved!");

      if (!data.every(businessType => !businessType._synced)) throw new Error("Please make sure that the business types sent are not yet synced in the database.");
      if (!data.every(businessType => businessType.type)) throw new Error("Please make sure that the business types sent must have a bank code.");

      const toUpdate = data.filter(e => e.action === "update");
      const toDelete = data.filter(e => e.action === "delete");

      if (toUpdate.length > 0) {
        if (!toUpdate.every(businessType => isValidObjectId(businessType._id))) throw new Error("All business types that needs to be updated must have a valid object id");
      }

      if (toDelete.length > 0) {
        if (!toDelete.every(businessType => isValidObjectId(businessType._id))) throw new Error("All business types that needs to be deleted must have a valid object id");
      }

      return true;
    }),
];
