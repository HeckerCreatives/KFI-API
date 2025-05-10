const CustomError = require("../../utils/custom-error.js");
const User = require("./user.schema.js");

exports.get_all = async (limit, page, offset, keyword) => {
  const filter = { deletedAt: null, role: "admin" };
  if (keyword) filter.code = new RegExp(keyword, "i");

  const countPromise = User.countDocuments(filter);
  const usersPromise = User.find(filter).skip(offset).limit(limit).exec();

  const [count, users] = await Promise.all([countPromise, usersPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    users,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_single = async filter => {
  const user = await User.findOne(filter).exec();
  if (!user) {
    throw new CustomError("User not found", 404);
  }
  return { success: true, user };
};

exports.create = async data => {
  const newUser = new User({
    name: data.name,
    username: data.username,
    password: data.password,
    role: "admin",
  });
  await newUser.savePassword(data.password);
  await newUser.save();
  if (!newUser) {
    throw new CustomError("Failed to create a new user", 500);
  }
  return {
    success: true,
    user: newUser,
  };
};

exports.change_password = async data => {
  const user = await User.findOne({ username: data.username }).exec();

  if (!user) {
    throw new CustomError("User not found", 404);
  }

  if (user && !(await user.matchPassword(oldPassword))) {
    throw new CustomError("Old Password does not match.", 400);
  }

  user.password = password;
  user.markModified("password");
  user.savePassword(password);
  await user.save();

  return {
    success: true,
    msg: "Password successfully changed.",
  };
};

exports.delete = async filter => {
  const deletedUser = await User.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedUser.acknowledged || deletedUser.modifiedCount < 1) {
    throw new CustomError("Failed to delete the user", 500);
  }
  return { success: true, user: filter._id };
};
