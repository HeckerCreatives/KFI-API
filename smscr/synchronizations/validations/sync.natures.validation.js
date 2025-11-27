const { body } = require("express-validator");
const { isValidObjectId } = require("mongoose");

exports.naturesUploadRules = [
  body("natures")
    .isArray()
    .withMessage("Natures must be an array")
    .custom(async data => {
      if (!Array.isArray(data)) throw new Error("Invalid offline changes");
      if (data.length < 1) throw new Error("There is no offline changes to be saved!");

      if (!data.every(nature => !nature._synced)) throw new Error("Please make sure that the natures sent are not yet synced in the database.");
      if (!data.every(nature => nature.nature)) throw new Error("Please make sure that the natures sent must have a nature.");
      if (!data.every(nature => nature.description)) throw new Error("Please make sure that the natures sent must have a description.");

      const toUpdate = data.filter(e => e.action === "update");
      const toDelete = data.filter(e => e.action === "delete");

      if (toUpdate.length > 0) {
        if (!toUpdate.every(nature => isValidObjectId(nature._id))) throw new Error("All natures that needs to be updated must have a valid object id");
      }

      if (toDelete.length > 0) {
        if (!toDelete.every(nature => isValidObjectId(nature._id))) throw new Error("All natures that needs to be deleted must have a valid object id");
      }

      return true;
    }),
];
