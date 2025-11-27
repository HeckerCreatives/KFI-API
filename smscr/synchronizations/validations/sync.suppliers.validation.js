const { body } = require("express-validator");
const Bank = require("../../banks/bank.schema");
const { isValidObjectId } = require("mongoose");
const Supplier = require("../../supplier/supplier.schema");

exports.suppliersUploadRules = [
  body("suppliers")
    .isArray()
    .withMessage("Business Suppliers must be an array")
    .custom(async data => {
      if (!Array.isArray(data)) throw new Error("Invalid offline changes");
      if (data.length < 1) throw new Error("There is no offline changes to be saved!");

      if (!data.every(supplier => !supplier._synced)) throw new Error("Please make sure that the business suppliers sent are not yet synced in the database.");
      if (!data.every(supplier => supplier.code)) throw new Error("Please make sure that the business suppliers sent must have a supplier code.");

      const toCreate = data.filter(e => e.action === "create");
      const toUpdate = data.filter(e => e.action === "update");
      const toDelete = data.filter(e => e.action === "delete");

      const codesToCreate = [...toCreate.map(e => e.code.toUpperCase())];
      const exists = await Supplier.countDocuments({ code: { $in: codesToCreate } }).exec();
      if (exists > 0) throw new Error("Please make sure that eh business suppliers you want to create/update does not already exists.");

      const codesToUpdate = [...toUpdate.map(e => ({ _id: e._id, code: e.code.toUpperCase() }))];
      let existed = 0;
      await Promise.all(
        codesToUpdate.map(async e => {
          const supplier = await Supplier.findById(e._id).lean().exec();
          if (supplier.code.toLowerCase() !== e.code.toLowerCase()) {
            const exists = await Supplier.exists({ code: e.code.toUpperCase(), deletedAt: null });
            if (exists) existed++;
          }
        })
      );

      if (existed > 0) throw new Error("Please make sure that the business suppliers you want to create/update does not already exists.");

      if (toUpdate.length > 0) {
        if (!toUpdate.every(supplier => isValidObjectId(supplier._id))) throw new Error("All business suppliers that needs to be updated must have a valid object id");
      }

      if (toDelete.length > 0) {
        if (!toDelete.every(supplier => isValidObjectId(supplier._id))) throw new Error("All business suppliers that needs to be deleted must have a valid object id");
      }

      return true;
    }),
];
