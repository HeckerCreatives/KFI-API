const { body } = require("express-validator");
const Bank = require("../../banks/bank.schema");
const { isValidObjectId } = require("mongoose");

exports.banksUploadRules = [
  body("banks")
    .isArray()
    .withMessage("Banks must be an array")
    .custom(async data => {
      if (!Array.isArray(data)) throw new Error("Invalid offline changes");
      if (data.length < 1) throw new Error("There is no offline changes to be saved!");

      if (!data.every(bank => !bank._synced)) throw new Error("Please make sure that the banks sent are not yet synced in the database.");
      if (!data.every(bank => bank.code)) throw new Error("Please make sure that the banks sent must have a bank code.");

      const toCreate = data.filter(e => e.action === "create");
      const toUpdate = data.filter(e => e.action === "update");
      const toDelete = data.filter(e => e.action === "delete");

      const codesToCreate = [...toCreate.map(e => e.code.toUpperCase())];
      const exists = await Bank.countDocuments({ code: { $in: codesToCreate } }).exec();
      if (exists > 0) throw new Error("Please make sure that eh banks you want to create/update does not already exists.");

      const codesToUpdate = [...toUpdate.map(e => ({ _id: e._id, code: e.code.toUpperCase() }))];
      let existed = 0;
      await Promise.all(
        codesToUpdate.map(async e => {
          const bank = await Bank.findById(e._id).lean().exec();
          if (bank.code.toLowerCase() !== e.code.toLowerCase()) {
            const exists = await Bank.exists({ code: e.code.toUpperCase(), deletedAt: null });
            if (exists) existed++;
          }
        })
      );

      if (existed > 0) throw new Error("Please make sure that eh banks you want to create/update does not already exists.");

      if (toUpdate.length > 0) {
        if (!toUpdate.every(bank => isValidObjectId(bank._id))) throw new Error("All banks that needs to be updated must have a valid object id");
      }

      if (toDelete.length > 0) {
        if (!toDelete.every(bank => isValidObjectId(bank._id))) throw new Error("All banks that needs to be deleted must have a valid object id");
      }

      return true;
    }),
];
