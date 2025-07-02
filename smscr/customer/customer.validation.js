const Center = require("../center/center.schema.js");
const BusinessType = require("../business-type/business-type.schema.js");
const Customer = require("./customer.schema.js");
const { body, param } = require("express-validator");

exports.customerIdRules = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Customer id is required")
    .isMongoId()
    .withMessage("Invalid customer id")
    .custom(async value => {
      const exists = await Customer.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Customer not found");
      return true;
    }),
];

exports.customerRules = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 1, max: 255 }).withMessage("Name must only consist of 1 to 255 characters"),
  body("address").trim().notEmpty().withMessage("Address is required").isLength({ min: 1, max: 255 }).withMessage("Address must only consist of 1 to 255 characters"),
  body("city").trim().notEmpty().withMessage("City is required").isLength({ min: 1, max: 255 }).withMessage("City must only consist of 1 to 255 characters"),
  body("telNo")
    .if(body("refNo").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Telephone no. is required")
    .matches(/^[2-9]\d{6}$/) // 7 digits, starting with 2-9
    .withMessage("Invalid telephone number (e.g., 5231234)"),
  ,
  body("mobileNo")
    .trim()
    .notEmpty()
    .withMessage("Mobile no. is required")
    .matches(/^(?:\+63|0)9\d{9}$/) // +639 or 09 followed by 9 digits
    .withMessage("Invalid mobile number (e.g., 09171234567 or +639171234567)")
    .customSanitizer(value => value.replace(/[^\d]/g, "")),
  body("zipCode").trim().notEmpty().withMessage("Zip code  is required").isLength({ min: 1, max: 255 }).withMessage("Zip code must only consist of 1 to 255 characters"),
  body("birthdate")
    .trim()
    .notEmpty()
    .withMessage("Birthdate is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Birthdate must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Birthdate must be a valid date (YYYY-MM-DD)")
    .toDate(),
  body("birthplace").trim().notEmpty().withMessage("Birthplace is required").isLength({ min: 1, max: 255 }).withMessage("Birthplace must only consist of 1 to 255 characters"),
  body("spouse").trim().notEmpty().withMessage("Spouse is required").isLength({ min: 1, max: 255 }).withMessage("Spouse must only consist of 1 to 255 characters"),
  body("memberStatus")
    .trim()
    .notEmpty()
    .withMessage("Member status is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Member status must only consist of 1 to 255 characters"),
  body("groupNumber").trim().notEmpty().withMessage("Group number is required").isLength({ min: 1, max: 255 }).withMessage("Group number must only consist of 1 to 255 characters"),
  body("civilStatus").trim().notEmpty().withMessage("Civil status is required").isLength({ min: 1, max: 255 }).withMessage("Civil status must only consist of 1 to 255 characters"),
  body("center")
    .trim()
    .notEmpty()
    .withMessage("Center is required")
    .isMongoId()
    .withMessage("Invalid center id")
    .isLength({ min: 1, max: 255 })
    .withMessage("Center must only consist of 1 to 255 characters")
    .custom(async value => {
      const exists = await Center.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Center not found");
      return true;
    }),
  body("dateRelease")
    .trim()
    .notEmpty()
    .withMessage("Date release is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Date release must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Date release must be a valid date (YYYY-MM-DD)")
    .toDate(),
  ,
  body("business")
    .trim()
    .notEmpty()
    .withMessage("Business is required")
    .isMongoId()
    .withMessage("Invalid business type id")
    .isLength({ min: 1, max: 255 })
    .withMessage("Business must only consist of 1 to 255 characters")
    .custom(async value => {
      const exists = await BusinessType.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Business type not found");
      return true;
    }),
  body("position").trim().notEmpty().withMessage("Position is required").isLength({ min: 1, max: 255 }).withMessage("Position must only consist of 1 to 255 characters"),
  body("age").trim().notEmpty().withMessage("Age is required").isLength({ min: 1, max: 255 }).withMessage("Age must only consist of 1 to 255 characters"),
  body("acctNumber")
    .trim()
    .notEmpty()
    .withMessage("Account no. is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Account no. must only consist of 1 to 255 characters")
    .custom(async value => {
      const exists = await Customer.exists({ acctNumber: value.toUpperCase(), deletedAt: null });
      if (exists) throw new Error("Account no. already exists");
      return true;
    }),
  body("acctOfficer")
    .trim()
    .notEmpty()
    .withMessage("Account officer is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Account officer must only consist of 1 to 255 characters"),
  body("sex").trim().notEmpty().withMessage("Sex is required").isLength({ min: 1, max: 255 }).withMessage("Sex must only consist of 1 to 255 characters"),
  body("dateResigned")
    .trim()
    .notEmpty()
    .withMessage("Date resigned is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Date resigned must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Date resigned must be a valid date (YYYY-MM-DD)")
    .toDate(),
  ,
  body("newStatus").trim().notEmpty().withMessage("New status is required").isLength({ min: 1, max: 255 }).withMessage("New status must only consist of 1 to 255 characters"),
  body("reason").trim().notEmpty().withMessage("Reason is required").isLength({ min: 1, max: 255 }).withMessage("Reason must only consist of 1 to 255 characters"),
  body("parent").trim().notEmpty().withMessage("Parent is required").isLength({ min: 1, max: 255 }).withMessage("Parent must only consist of 1 to 255 characters"),
];

exports.updateCustomerRules = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 1, max: 255 }).withMessage("Name must only consist of 1 to 255 characters"),
  body("address").trim().notEmpty().withMessage("Address is required").isLength({ min: 1, max: 255 }).withMessage("Address must only consist of 1 to 255 characters"),
  body("city").trim().notEmpty().withMessage("City is required").isLength({ min: 1, max: 255 }).withMessage("City must only consist of 1 to 255 characters"),
  body("telNo")
    .if(body("refNo").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Telephone no. is required")
    .matches(/^[2-9]\d{6}$/) // 7 digits, starting with 2-9
    .withMessage("Invalid telephone number (e.g., 5231234)"),
  ,
  body("mobileNo")
    .trim()
    .notEmpty()
    .withMessage("Mobile no. is required")
    .matches(/^(?:\+63|0)9\d{9}$/) // +639 or 09 followed by 9 digits
    .withMessage("Invalid mobile number (e.g., 09171234567 or +639171234567)")
    .customSanitizer(value => value.replace(/[^\d]/g, "")),
  body("zipCode").trim().notEmpty().withMessage("Zip code  is required").isLength({ min: 1, max: 255 }).withMessage("Zip code must only consist of 1 to 255 characters"),
  body("birthdate")
    .trim()
    .notEmpty()
    .withMessage("Birthdate is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Birthdate must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Birthdate must be a valid date (YYYY-MM-DD)")
    .toDate(),
  body("birthplace").trim().notEmpty().withMessage("Birthplace is required").isLength({ min: 1, max: 255 }).withMessage("Birthplace must only consist of 1 to 255 characters"),
  body("spouse").trim().notEmpty().withMessage("Spouse is required").isLength({ min: 1, max: 255 }).withMessage("Spouse must only consist of 1 to 255 characters"),
  body("memberStatus")
    .trim()
    .notEmpty()
    .withMessage("Member status is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Member status must only consist of 1 to 255 characters"),
  body("groupNumber").trim().notEmpty().withMessage("Group number is required").isLength({ min: 1, max: 255 }).withMessage("Group number must only consist of 1 to 255 characters"),
  body("civilStatus").trim().notEmpty().withMessage("Civil status is required").isLength({ min: 1, max: 255 }).withMessage("Civil status must only consist of 1 to 255 characters"),
  body("center")
    .trim()
    .notEmpty()
    .withMessage("Center is required")
    .isMongoId()
    .withMessage("Invalid center id")
    .isLength({ min: 1, max: 255 })
    .withMessage("Center must only consist of 1 to 255 characters")
    .custom(async value => {
      const exists = await Center.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Center not found");
      return true;
    }),
  body("dateRelease")
    .trim()
    .notEmpty()
    .withMessage("Date release is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Date release must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Date release must be a valid date (YYYY-MM-DD)")
    .toDate(),
  ,
  body("business")
    .trim()
    .notEmpty()
    .withMessage("Business is required")
    .isMongoId()
    .withMessage("Invalid business type id")
    .isLength({ min: 1, max: 255 })
    .withMessage("Business must only consist of 1 to 255 characters")
    .custom(async value => {
      const exists = await BusinessType.exists({ _id: value, deletedAt: null });
      if (!exists) throw new Error("Business type not found");
      return true;
    }),
  body("position").trim().notEmpty().withMessage("Position is required").isLength({ min: 1, max: 255 }).withMessage("Position must only consist of 1 to 255 characters"),
  body("age").trim().notEmpty().withMessage("Age is required").isLength({ min: 1, max: 255 }).withMessage("Age must only consist of 1 to 255 characters"),
  body("acctNumber")
    .trim()
    .notEmpty()
    .withMessage("Account no. is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Account no. must only consist of 1 to 255 characters")
    .custom(async (value, { req }) => {
      const customer = await Customer.findOne({ _id: req.params.id, deletedAt: null }).lean().exec();
      if (customer.acctNumber.toLowerCase() !== value.toLowerCase()) {
        const exists = await Customer.exists({ acctNumber: value.toUpperCase(), deletedAt: null });
        if (exists) throw new Error("Account no. already exists");
      }
      return true;
    }),
  body("acctOfficer")
    .trim()
    .notEmpty()
    .withMessage("Account officer is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Account officer must only consist of 1 to 255 characters"),
  body("sex").trim().notEmpty().withMessage("Sex is required").isLength({ min: 1, max: 255 }).withMessage("Sex must only consist of 1 to 255 characters"),
  body("dateResigned")
    .trim()
    .notEmpty()
    .withMessage("Date resigned is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Date resigned must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Date resigned must be a valid date (YYYY-MM-DD)")
    .toDate(),
  ,
  body("newStatus").trim().notEmpty().withMessage("New status is required").isLength({ min: 1, max: 255 }).withMessage("New status must only consist of 1 to 255 characters"),
  body("reason").trim().notEmpty().withMessage("Reason is required").isLength({ min: 1, max: 255 }).withMessage("Reason must only consist of 1 to 255 characters"),
  body("parent").trim().notEmpty().withMessage("Parent is required").isLength({ min: 1, max: 255 }).withMessage("Parent must only consist of 1 to 255 characters"),
];
