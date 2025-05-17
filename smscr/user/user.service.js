const { default: mongoose } = require("mongoose");
const CustomError = require("../../utils/custom-error.js");
const User = require("./user.schema.js");

exports.get_all = async (limit, page, offset, keyword, sort) => {
  const filter = { deletedAt: null, role: "user" };
  if (keyword) filter.$or = [{ name: new RegExp(keyword, "i") }, { username: new RegExp(keyword, "i") }];

  const query = User.find(filter);
  if (sort && ["name-asc", "name-desc"].includes(sort)) query.sort({ name: sort === "name-asc" ? 1 : -1 });
  else if (sort && ["user-asc", "user-desc"].includes(sort)) query.sort({ username: sort === "user-asc" ? 1 : -1 });
  else query.sort({ createdAt: -1 });

  const countPromise = User.countDocuments(filter);
  const usersPromise = query.skip(offset).limit(limit).exec();

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
    role: "user",
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

exports.ban_users = async (data, status) => {
  const { ids } = data;
  const updated = await User.updateMany({ _id: { $in: ids } }, { $set: { status } });

  if (updated.modifiedCount !== ids.length) {
    throw new CustomError("Failed to ban to selected users", 500);
  }
  return {
    success: true,
    user: ids,
  };
};

exports.update_permissions = async (id, data) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { permissions } = data;
    const updateOperations = permissions.map(permission => ({
      updateOne: {
        filter: {
          _id: id,
          "permissions._id": permission._id,
          "permissions.resource": permission.resource,
        },
        update: { $set: { "permissions.$.actions": permission.actions } },
      },
    }));

    const updates = await User.bulkWrite(updateOperations);

    if (updates.matchedCount !== permissions.length || updates.modifiedCount < 1) {
      throw new CustomError("Failed to set permissions", 500);
    }

    const user = await this.get_single({ _id: id, deletedAt: null, role: "user" });

    return {
      success: true,
      user,
    };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to set permissions", error.statusCode || 500);
  } finally {
    session.endSession();
  }
};

exports.change_password = async data => {
  const user = await User.findOne({ username: data.username }).exec();

  if (!user) {
    throw new CustomError("User not found", 404);
  }

  user.password = data.password;
  user.markModified("password");
  await user.savePassword(data.password);
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
