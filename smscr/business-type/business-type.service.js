const CustomError = require("../../utils/custom-error.js");
const BusinessType = require("./business-type.schema.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");

exports.get_selections = async (keyword, limit, page, offset) => {
  const filter = { deletedAt: null, type: new RegExp(keyword, "i") };

  const businessTypesPromise = BusinessType.find(filter).skip(offset).limit(limit).lean().exec();
  const countPromise = BusinessType.countDocuments(filter);

  const [count, businessTypes] = await Promise.all([countPromise, businessTypesPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    businessTypes,
    hasPrevPage,
    hasNextPage,
    totalPages,
  };
};

exports.get_options = async () => {
  const filter = { deletedAt: null };
  const options = await BusinessType.find(filter, { label: "$type", value: "$_id", _id: 0 }).lean().exec();
  return {
    success: true,
    businessTypes: options,
  };
};

exports.get_all = async (limit, page, offset, keyword, sort) => {
  const filter = { deletedAt: null };
  if (keyword) filter.type = new RegExp(keyword, "i");

  const query = BusinessType.find(filter);
  if (sort && ["type-asc", "type-desc"].includes(sort)) query.sort({ type: sort === "type-asc" ? 1 : -1 });
  else query.sort({ createdAt: -1 });

  const countPromise = BusinessType.countDocuments(filter);
  const businessTypesPromise = query.skip(offset).limit(limit).exec();

  const [count, businessTypes] = await Promise.all([countPromise, businessTypesPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    businessTypes,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_single = async filter => {
  const businessType = await BusinessType.findOne(filter).exec();
  if (!businessType) {
    throw new CustomError("Business type not found", 404);
  }
  return { success: true, businessType };
};

exports.create = async (data, author) => {
  const newBusinessType = await new BusinessType({
    type: data.type,
  }).save();
  if (!newBusinessType) {
    throw new CustomError("Failed to create a new business type", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `created a business type`,
    resource: `business type`,
    dataId: newBusinessType._id,
  });

  return {
    success: true,
    businessType: newBusinessType,
  };
};

exports.update = async (filter, data, author) => {
  const updatedBusinessType = await BusinessType.findOneAndUpdate(filter, { $set: { type: data.type } }, { new: true }).exec();
  if (!updatedBusinessType) {
    throw new CustomError("Failed to update the business type", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `updated a business type`,
    resource: `business type`,
    dataId: updatedBusinessType._id,
  });

  return { success: true, businessType: updatedBusinessType };
};

exports.delete = async (filter, author) => {
  const deletedBusinessType = await BusinessType.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedBusinessType.acknowledged || deletedBusinessType.modifiedCount < 1) {
    throw new CustomError("Failed to delete the business type", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `deleted a business type`,
    resource: `business type`,
    dataId: filter._id,
  });

  return { success: true, businessType: filter._id };
};
