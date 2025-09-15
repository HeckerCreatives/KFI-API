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
  body("approvedBy").custom(async (value, { req }) => {
    const type = req.body.type;
    if (!signatureType.includes(type)) throw new Error("Invalid page");

    if (!["loan release", "expense voucher", "journal voucher", "damayan fund", "emergency loan"].includes(type)) return true;
    if (String(value).trim() === "") throw new Error("Approved by is required");
    return true;
  }),
  body("checkedBy").custom((value, { req }) => {
    const type = req.body.type;
    if (!signatureType.includes(type)) throw new Error("Invalid page");
    if (!["loan release", "official receipt", "journal voucher", "damayan fund", "emergency loan"].includes(type)) return true;
    if (String(value).trim() === "") throw new Error("Checked by is required");
    return true;
  }),
  body("verifiedBy").custom((value, { req }) => {
    const type = req.body.type;
    if (!signatureType.includes(type)) throw new Error("Invalid page");
    if (!["expense voucher"].includes(type)) return true;
    if (String(value).trim() === "") throw new Error("Verified by is required");
    return true;
  }),
  body("notedBy").custom((value, { req }) => {
    const type = req.body.type;
    if (!signatureType.includes(type)) throw new Error("Invalid page");
    if (!["official receipt"].includes(type)) return true;
    if (String(value).trim() === "") throw new Error("Noted by is required");
    return true;
  }),
];
