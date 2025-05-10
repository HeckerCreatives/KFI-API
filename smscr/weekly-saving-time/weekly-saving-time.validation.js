const { param, body } = require("express-validator");
const WeeklySavingTime = require("./weekly-saving-time.schema");

exports.weeklySavingTimeIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Weekly saving time id is required")
    .isMongoId()
    .withMessage("Invalid weekly saving time id")
    .custom(async value => {
      const exists = await WeeklySavingTime.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Weekly saving time not found");
      return true;
    }),
];

exports.weeklySavingTimeRules = [
  body("week").trim().notEmpty().withMessage("Week is required").isLength({ min: 1, max: 255 }).withMessage("Week must only consist of 1 to 255 characters"),
];
