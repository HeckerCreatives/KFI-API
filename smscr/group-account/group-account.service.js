const CustomError = require("../../utils/custom-error.js");
const GroupAccount = require("./group-account.schema.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");

exports.get_selections = async keyword => {
  const filter = { deletedAt: null, centerNo: new RegExp(keyword, "i") };
  const groupAccounts = await GroupAccount.find(filter).lean().exec();
  return {
    success: true,
    groupAccounts,
  };
};

exports.get_options = async () => {
  const filter = { deletedAt: null };
  const options = await GroupAccount.find(filter, { label: "$code", value: "$_id", _id: 0 }).lean().exec();
  return {
    success: true,
    groupAccounts: options,
  };
};

exports.get_all = async (limit, page, offset, keyword, sort) => {
  const filter = { deletedAt: null };
  if (keyword) filter.code = new RegExp(keyword, "i");

  const query = GroupAccount.find(filter);
  if (sort && ["code-asc", "code-desc"].includes(sort)) query.sort({ code: sort === "code-asc" ? 1 : -1 });
  else query.sort({ createdAt: -1 });

  const countPromise = GroupAccount.countDocuments(filter);
  const groupAccountsPromise = query.skip(offset).limit(limit).exec();

  const [count, groupAccounts] = await Promise.all([countPromise, groupAccountsPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    groupAccounts,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_single = async filter => {
  const groupAccount = await GroupAccount.findOne(filter).exec();
  if (!groupAccount) {
    throw new CustomError("Group account not found", 404);
  }
  return { success: true, groupAccount };
};

exports.create = async (data, author) => {
  const newGroupAccount = await new GroupAccount({
    code: data.code.toUpperCase(),
  }).save();
  if (!newGroupAccount) {
    throw new CustomError("Failed to create a new group account", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `created a new group of account`,
    resource: `group of account`,
    dataId: newGroupAccount._id,
  });

  return {
    success: true,
    groupAccount: newGroupAccount,
  };
};

exports.update = async (filter, data, author) => {
  const updatedGroupAccount = await GroupAccount.findOneAndUpdate(filter, { $set: { code: data.code.toUpperCase() } }, { new: true }).exec();
  if (!updatedGroupAccount) {
    throw new CustomError("Failed to update the group account", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `updated a group of account`,
    resource: `group of account`,
    dataId: updatedGroupAccount._id,
  });

  return { success: true, groupAccount: updatedGroupAccount };
};

exports.delete = async (filter, author) => {
  const deletedGroupAccount = await GroupAccount.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedGroupAccount.acknowledged || deletedGroupAccount.modifiedCount < 1) {
    throw new CustomError("Failed to delete the group account", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `deleted a group of account`,
    resource: `group of account`,
    dataId: filter._id,
  });

  return { success: true, groupAccount: filter._id };
};
