const { body } = require("express-validator");
const Center = require("../../center/center.schema");
const { isValidObjectId } = require("mongoose");

exports.centersUploadRules = [
  body("centers")
    .isArray()
    .withMessage("Centers must be an array")
    .custom(async data => {
      if (!Array.isArray(data)) throw new Error("Invalid offline changes");
      if (data.length < 1) throw new Error("There is no offline changes to be saved!");

      if (!data.every(center => !center._synced)) throw new Error("Please make sure that the centers sent are not yet synced in the database.");

      const toUpdate = data.filter(e => e.action === "update");
      const toDelete = data.filter(e => e.action === "delete");

      if (toUpdate.length > 0) {
        if (!toUpdate.every(center => isValidObjectId(center._id))) throw new Error("All centers that needs to be updated must have a valid object id");
      }

      if (toDelete.length > 0) {
        if (!toUpdate.every(center => isValidObjectId(center._id))) throw new Error("All centers that needs to be deleted must have a valid object id");
      }

      return true;
    }),
  body("centers.*.centerNo")
    .trim()
    .notEmpty()
    .withMessage("Center No. is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Center No. must only consist of 255 characters")
    .custom(async (value, { req, path }) => {
      const index = path.match(/centers\[(\d+)\]\.centerNo/)[1];
      const center = req.body.centers[index];
      const action = center.action;

      if (action === "create") {
        const exists = await Center.exists({ deletedAt: null, centerNo: value.toUpperCase() }).exec();
        if (exists) throw new Error("Center no already exists.");
      } else if (action === "update") {
        const center2 = await Center.findOne({ _id: center._id }).lean().exec();
        if (!center2) throw new Error("Center not found");
        if (center2.centerNo.toUpperCase() !== value.toUpperCase()) {
          const exists = await Center.exists({ deletedAt: null, centerNo: value.toUpperCase() }).exec();
          if (exists) throw new Error("Center no already exists.");
        }
      }

      return true;
    }),
  body("centers.*.description")
    .if(body("description").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Description must only consist of 255 characters"),
  body("centers.*.location")
    .if(body("location").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Location is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Location must only consist of 255 characters"),
  body("centers.*.centerChief")
    .if(body("centerChief").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Center Chief is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Center Chief must only consist of 255 characters"),
  body("centers.*.treasurer")
    .if(body("treasurer").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Treasurer is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Treasurer must only consist of 255 characters"),
  body("centers.*.acctOfficer")
    .trim()
    .notEmpty()
    .withMessage("Account Officer is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Account Officer must only consist of 255 characters"),
];
