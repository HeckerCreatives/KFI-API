const { body } = require("express-validator");
const Customer = require("../../customer/customer.schema");
const Center = require("../../center/center.schema");
const { memberStatuses } = require("../../../constants/member-status");
const BusinessType = require("../../business-type/business-type.schema");

exports.clientUploadRules = [
  body("clients")
    .isArray()
    .withMessage("Clients must be an array")
    .custom(value => {
      if (!Array.isArray(value)) throw new Error("Clients must be an array");
      if (value.length < 1) throw new Error("Atleast 1 client is required");
      if (!value.every(client => !client._synced)) throw new Error("Please make sure that the client sent are not yet synced in the database.");
      if (!value.every(client => client.action)) throw new Error("Please make sure that the client sent are have an action to make.");
      if (!value.every(client => ["create", "update", "delete"].includes(client.action)))
        throw new Error("An invalid action is found. Please make sure that the actions are only create, update and delete");

      return true;
    }),
  body("clients.*._id")
    .if(body("clients.*.action").custom(value => ["update", "delete"].includes(value)))
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
  body("clients.*.name")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Name must only consist of 1 to 255 characters"),
  body("clients.*.address")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
    .trim()
    .notEmpty()
    .withMessage("Address is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Address must only consist of 1 to 255 characters"),
  body("clients.*.city")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
    .trim()
    .notEmpty()
    .withMessage("City is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("City must only consist of 1 to 255 characters"),
  body("clients.*.telNo")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
    .if(body("clients.*.telNo").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Telephone no. is required")
    .matches(/^[2-9]\d{6}$/) // 7 digits, starting with 2-9
    .withMessage("Invalid telephone number (e.g., 5231234)"),
  ,
  body("clients.*.mobileNo")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
    .trim()
    .notEmpty()
    .withMessage("Mobile no. is required")
    .matches(/^(?:63|0)9\d{9}$/) // +639 or 09 followed by 9 digits
    .withMessage("Invalid mobile number (e.g., 09171234567 or 639171234567)")
    .customSanitizer(value => value.replace(/[^\d]/g, "")),
  body("clients.*.bankAccountNo")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
    .trim()
    .notEmpty()
    .withMessage("Bank account number is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Bank account number must only consist of 1 to 255 characters"),
  body("clients.*.zipCode")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
    .trim()
    .notEmpty()
    .withMessage("Zip code  is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Zip code must only consist of 1 to 255 characters"),
  body("clients.*.birthdate")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
    .trim()
    .notEmpty()
    .withMessage("Birthdate is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Birthdate must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Birthdate must be a valid date (YYYY-MM-DD)")
    .toDate(),
  body("clients.*.birthplace")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
    .trim()
    .notEmpty()
    .withMessage("Birthplace is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Birthplace must only consist of 1 to 255 characters"),
  body("clients.*.spouse")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
    .if(body("clients.*.spouse").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Spouse is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Spouse must only consist of 1 to 255 characters"),
  body("clients.*.memberStatusLabel")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
    .trim()
    .notEmpty()
    .withMessage("Member status is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Member status must only consist of 1 to 255 characters")
    .custom((value, { req, path }) => {
      const match = path.match(/clients\[(\d+)\]\.memberStatusLabel/);
      const index = match[1];
      const memberStatus = req.body.clients[index].memberStatus;

      if (!memberStatuses.includes(value) || !memberStatuses.includes(memberStatus)) {
        throw new Error("Please select a valid member status");
      }
      return true;
    }),
  body("clients.*.civilStatus")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
    .trim()
    .notEmpty()
    .withMessage("Civil status is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Civil status must only consist of 1 to 255 characters"),
  body("clients.*.center")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
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
  body("clients.*.dateRelease")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
    .trim()
    .notEmpty()
    .withMessage("Date release is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Date release must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Date release must be a valid date (YYYY-MM-DD)")
    .toDate(),
  body("clients.*.business")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
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
  body("clients.*.position")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
    .trim()
    .notEmpty()
    .withMessage("Position is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Position must only consist of 1 to 255 characters"),
  body("clients.*.age")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
    .trim()
    .notEmpty()
    .withMessage("Age is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Age must only consist of 1 to 255 characters"),
  body("clients.*.acctNumber")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
    .trim()
    .notEmpty()
    .withMessage("Account no. is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Account no. must only consist of 1 to 255 characters"),
  body("clients.*.acctNumber")
    .if(body("clients.*.action").custom(value => ["create"].includes(value)))
    .custom(async value => {
      const exists = await Customer.exists({ acctNumber: value.toUpperCase(), deletedAt: null });
      if (exists) throw new Error("Account no. already exists");
      return true;
    }),
  body("clients.*.acctNumber")
    .if(body("clients.*.action").custom(value => ["update"].includes(value)))
    .custom(async (value, { req, path }) => {
      const match = path.match(/clients\[(\d+)\]\.acctNumber/);
      const index = match[1];
      const customer = await Customer.findOne({ _id: req.body.clients[index]._id, deletedAt: null }).lean().exec();
      if (customer.acctNumber.toLowerCase() !== value.toLowerCase()) {
        const exists = await Customer.exists({ acctNumber: value.toUpperCase(), deletedAt: null });
        if (exists) throw new Error("Account no. already exists");
      }
      return true;
    }),
  body("clients.*.acctOfficer")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
    .trim()
    .notEmpty()
    .withMessage("Account officer is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Account officer must only consist of 1 to 255 characters"),
  body("clients.*.sex")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
    .trim()
    .notEmpty()
    .withMessage("Sex is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Sex must only consist of 1 to 255 characters"),
  body("clients.*.dateResigned")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
    .if(body("clients.*.dateResigned").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Date resigned is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Date resigned must only consist of 1 to 255 characters")
    .isDate({ format: "YYYY-MM-DD" })
    .withMessage("Date resigned must be a valid date (YYYY-MM-DD)")
    .toDate(),
  body("clients.*.reason")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
    .if(body("reason").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Reason is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Reason must only consist of 1 to 255 characters"),
  body("clients.*.parent")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
    .if(body("parent").notEmpty())
    .trim()
    .notEmpty()
    .withMessage("Parent is required")
    .isLength({ min: 1, max: 255 })
    .withMessage("Parent must only consist of 1 to 255 characters"),
  body("clients.*.beneficiaries")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
    .optional()
    .customSanitizer(value => {
      try {
        return typeof value === "string" ? JSON.parse(value) : value;
      } catch {
        throw new Error("Invalid JSON format for children");
      }
    })
    .isArray(),
  body("clients.*.children")
    .if(body("clients.*.action").custom(value => ["update", "create"].includes(value)))
    .optional()
    .customSanitizer(value => {
      try {
        return typeof value === "string" ? JSON.parse(value) : value;
      } catch {
        throw new Error("Invalid JSON format for beneficiaries");
      }
    })
    .isArray(),
];
