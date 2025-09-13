const CustomError = require("../../utils/custom-error.js");
const LoginLog = require("./login-log.schema.js");

exports.get_all = async (limit, page, offset) => {
  const countPromise = LoginLog.countDocuments();
  const logsPromise = LoginLog.find()
    .populate({
      path: "user",
      select: "username -_id",
    })
    .sort("-createdAt")
    .skip(offset)
    .limit(limit)
    .exec();

  const [count, logs] = await Promise.all([countPromise, logsPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    logs,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.create = async (user, deviceName) => {
  const log = await new LoginLog({ user, deviceName, lastLogin: new Date().toISOString() }).save();
  if (!log) throw new CustomError("Failed to create a login log", 500);
  return { success: true };
};
