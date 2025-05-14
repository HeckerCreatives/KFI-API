const { param, body } = require("express-validator");
const Supplier = require("./supplier.schema");

exports.supplierIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Supplier id is required")
    .isMongoId()
    .withMessage("Invalid supplier id")
    .custom(async value => {
      const exists = await Supplier.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Supplier not found");
      return true;
    }),
];

exports.supplierRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Code is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Code must only consist of 1 to 255 characters")
    .custom(async value => {
      const exists = await Supplier.exists({ code: value.toUpperCase(), deletedAt: null });
      if (!exists) throw new Error("Supplier not found");
      return true;
    }),
  body("description").trim().notEmpty().withMessage("Description is required").isLength({ min: 1, max: 255 }).withMessage("Description must only consist of 1 to 255 characters"),
];

exports.supplierRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Code is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Code must only consist of 1 to 255 characters")
    .custom(async value => {
      const exists = await Supplier.exists({ code: value.toUpperCase(), deletedAt: null });
      if (exists) throw new Error("Supplier already exists");
      return true;
    }),
  body("description").trim().notEmpty().withMessage("Description is required").isLength({ min: 1, max: 255 }).withMessage("Description must only consist of 1 to 255 characters"),
];

exports.updateSupplierRules = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Code is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Code must only consist of 1 to 255 characters")
    .custom(async (value, { req }) => {
      const supplier = await Supplier.findById(req.params.id).lean().exec();
      if (supplier.code.toLowerCase() !== value.toLowerCase()) {
        const exists = await Supplier.exists({ code: value.toUpperCase(), deletedAt: null });
        if (exists) throw new Error("Supplier code already exists");
      }
      return true;
    }),
  body("description").trim().notEmpty().withMessage("Description is required").isLength({ min: 1, max: 255 }).withMessage("Description must only consist of 1 to 255 characters"),
];
