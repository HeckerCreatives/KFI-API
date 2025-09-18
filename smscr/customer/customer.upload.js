const multer = require("multer");
const fs = require("fs");
const path = require("path");
const CustomError = require("../../utils/custom-error");
const crypto = require("crypto");

const validateFile = async (req, file, cb) => {
  const type = file.mimetype.split("/")[0];

  if (type !== "image") {
    cb(new CustomError("Invalid image. Please select an image.", 400, [{ path: file.fieldname, msgs: ["Invalid image. Please select an image."] }]));
    return;
  }

  cb(null, true);
};

const customerUploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.resolve(global.rootDir, "uploads", "clients");
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const format = file.originalname.split(".")[file.originalname.split(".").length - 1];
    const filename = `${crypto.randomUUID().split("-").join("")}.${format}`;
    cb(null, filename);
  },
});

const clientUpload = multer({
  storage: customerUploadStorage,
  fileFilter: validateFile,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("clientImage");

const clientUploadCheck = (req, res, next) => {
  clientUpload(req, res, async err => {
    if (err instanceof multer.MulterError) {
      next(new CustomError(err.message || "Failed to upload image.", err.statusCode || 500, err.validationErrors || []));
    } else if (err) {
      next(new CustomError(err.message || "Failed to upload image.", err.statusCode || 500, err.validationErrors || []));
    }
    next();
  });
};

module.exports = clientUploadCheck;
