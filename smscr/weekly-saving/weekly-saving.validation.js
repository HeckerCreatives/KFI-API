const { param, body } = require("express-validator");
const WeeklySaving = require("./weekly-saving.schema");

exports.weeklySavingIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Weekly saving id is required")
    .isMongoId()
    .withMessage("Invalid weekly saving id")
    .custom(async value => {
      const exists = await WeeklySaving.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Weekly saving not found");
      return true;
    }),
];

exports.weeklySavingRules = [
  body("rangeAmountFrom")
    .trim()
    .notEmpty()
    .withMessage("Range amount from is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Range amount from must only consist of 1 to 255 characters")
    .isNumeric()
    .withMessage("Range amount from must be a number"),
  body("rangeAmountTo")
    .trim()
    .notEmpty()
    .withMessage("Range amount to is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Range amount to must only consist of 1 to 255 characters")
    .isNumeric()
    .withMessage("Range amount to must be a number"),
  body("weeklySavingsFund")
    .trim()
    .notEmpty()
    .withMessage("Weekly savings fund is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Weekly savings fund must only consist of 1 to 255 characters")
    .isNumeric()
    .withMessage("Weekly savings fund must be a number"),
];
