const { body } = require("express-validator");
const { isValidObjectId } = require("mongoose");

exports.loanProductsUploadRules = [
  body("products")
    .isArray()
    .withMessage("Loan Products must be an array")
    .custom(async data => {
      if (!Array.isArray(data)) throw new Error("Invalid offline changes");
      if (data.length < 1) throw new Error("There is no offline changes to be saved!");

      const toCreate = data.filter(e => e.action === "create");
      const toUpdate = data.filter(e => e.action === "update");
      const toDelete = data.filter(e => e.action === "delete");

      const toMutate = [...toCreate, ...toUpdate];

      if (!toDelete.every(product => isValidObjectId(product._id))) throw new Error("Please make sure that the loan products sent must have a loan product id");
      if (!toUpdate.every(product => isValidObjectId(product._id))) throw new Error("Please make sure that the loan products sent must have a loan product id");

      if (!toMutate.every(product => !product._synced)) throw new Error("Please make sure that the loan products sent are not yet synced in the database.");

      if (!toMutate.every(product => product.code)) throw new Error("Please make sure that the loan products sent must have a code.");
      if (!toMutate.every(product => product.description)) throw new Error("Please make sure that the loan products sent must have a description.");

      if (toCreate.length > 0) {
        toCreate.map(product => {
          const loanCodesToCreate = product.loanCodes.filter(e => e.action === "create");

          if (!loanCodesToCreate.every(loanCode => !loanCode._synced)) throw new Error("Please make sure that the load product codes sent are not yet synced in the database.");
          if (!loanCodesToCreate.every(loanCode => isValidObjectId(loanCode.acctCode._id)))
            throw new Error("Please make sure that all the loan code account codes are present and valid.");
          if (!loanCodesToCreate.every(loanCode => loanCode.module)) throw new Error("Please make sure that all the loan code have a module");
          if (!loanCodesToCreate.every(loanCode => loanCode.loanType)) throw new Error("Please make sure that all the loan code have a loan type");
          if (!loanCodesToCreate.every(loanCode => !isNaN(loanCode.sortOrder)))
            throw new Error("Please make sure that all the loan code have a sort order and it must be a number.");
        });
      }

      if (toUpdate.length > 0) {
        toUpdate.map(product => {
          const loanCodesToCreate = product.loanCodes.filter(e => e.action === "create");
          const loanCodesToDelete = product.loanCodes.filter(e => e.action === "delete");
          const loanCodesToUpdate = product.loanCodes.filter(e => e.action === "update");
          const loanCodesToMutate = [...loanCodesToCreate, ...loanCodesToUpdate];

          if (!loanCodesToMutate.every(loanCode => !loanCode._synced)) throw new Error("Please make sure that the load product codes sent are not yet synced in the database.");
          if (!loanCodesToMutate.every(loanCode => isValidObjectId(loanCode.acctCode._id)))
            throw new Error("Please make sure that all the loan code account codes are present and valid.");

          if (!loanCodesToMutate.every(loanCode => loanCode.module)) throw new Error("Please make sure that all the loan code have a module");
          if (!loanCodesToMutate.every(loanCode => loanCode.loanType)) throw new Error("Please make sure that all the loan code have a loan type");
          if (!loanCodesToMutate.every(loanCode => !isNaN(loanCode.sortOrder)))
            throw new Error("Please make sure that all the loan code have a sort order and it must be a number.");

          if (!loanCodesToUpdate.every(loanCode => isValidObjectId(loanCode._id)))
            throw new Error("Please make sure that all the loan code that must be updated must have a valid id.");

          if (!loanCodesToDelete.every(loanCode => isValidObjectId(loanCode._id)))
            throw new Error("Please make sure that all the loan code that must be deleted must have a valid id.");
        });
      }

      return true;
    }),
];
