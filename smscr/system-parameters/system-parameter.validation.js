const { body, param } = require("express-validator");
const { signatureType } = require("../../constants/signature-type");
const SignatureParam = require("./signature-param");

exports.updateSignatureParamRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Signature param id is required")
    .custom(async (value, { req }) => {
      const exists = await SignatureParam.exists({ _id: value, type: req.body.type }).exec();
      if (!exists) throw new Error("Signature param does not found");
    }),
  body("type")
    .trim()
    .notEmpty()
    .withMessage("Page is required")
    .custom(value => {
      if (!signatureType.includes(value)) throw new Error("Invalid page");
      return true;
    }),
  body("approvedBy").trim().notEmpty().withMessage("Approved by is required").isLength({ min: 1, max: 255 }).withMessage("Approved by must only consist of 1 to 255 characters"),
  body("checkedBy").trim().notEmpty().withMessage("Checked by is required").isLength({ min: 1, max: 255 }).withMessage("Checked by must only consist of 1 to 255 characters"),
  body("receivedBy")
    .if(body("receivedBy").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Received by is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Received by must only consist of 1 to 255 characters"),
];
