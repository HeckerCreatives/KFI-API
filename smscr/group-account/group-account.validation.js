const { body, param } = require("express-validator");
const GroupAccount = require("./group-account.schema.js");

exports.groupAccountIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Group account id is required")
    .isMongoId()
    .withMessage("Invalid group account id")
    .custom(async value => {
      const exists = await GroupAccount.exists({ _id: value, deletedAt: null });
      if (!exists) {
        throw new Error("Group account not found.");
      }
      return true;
    }),
];

exports.groupAccountRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Code is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Code must consist of only 1 to 255 characters.")
    .custom(async value => {
      const exists = await GroupAccount.exists({ code: value.toUpperCase(), deletedAt: null });
      if (exists) {
        throw Error("Group account code already exists");
      }
      return true;
    }),
];

exports.updateGroupAccountRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Code is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Code must consist of only 1 to 255 characters.")
    .custom(async (value, { req }) => {
      const groupAccount = await GroupAccount.findById(req.params.id).lean().exec();
      if (groupAccount.code.toLowerCase() !== value.toLowerCase()) {
        const exists = await GroupAccount.exists({ code: value.toUpperCase(), deletedAt: null });
        if (exists) throw new Error("Group account code already exists");
      }
      return true;
    }),
];
