const CustomError = require("../../utils/custom-error.js");
const Center = require("./center.schema.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");

exports.get_selections = async keyword => {
  const filter = { deletedAt: null, centerNo: new RegExp(keyword, "i") };
  const centers = await Center.find(filter, { code: "$centerNo", description: "$description" }).lean().exec();
  return {
    success: true,
    centers,
  };
};

exports.get_options = async () => {
  const filter = { deletedAt: null };
  const options = await Center.find(filter, { label: "$centerNo", value: "$_id", _id: 0 }).lean().exec();
  return {
    success: true,
    centers: options,
  };
};

exports.get_all = async (limit, page, offset, keyword, sort) => {
  const filter = { deletedAt: null };
  if (keyword) filter.$or = [{ centerNo: new RegExp(keyword, "i") }, { description: new RegExp(keyword, "i") }];

  const query = Center.find(filter);
  if (sort && ["centerno-asc", "centerno-desc"].includes(sort)) query.sort({ centerNo: sort === "centerno-asc" ? 1 : -1 });
  else if (sort && ["description-asc", "description-desc"].includes(sort)) query.sort({ description: sort === "description-asc" ? 1 : -1 });
  else query.sort({ createdAt: -1 });

  const countPromise = Center.countDocuments(filter);
  const centersPromise = query.skip(offset).limit(limit).exec();

  const [count, centers] = await Promise.all([countPromise, centersPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    centers,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_single = async filter => {
  const center = await Center.findOne(filter).exec();
  if (!center) {
    throw new CustomError("Center not found", 404);
  }
  return { success: true, center };
};

exports.create = async (data, author) => {
  const newCenter = await new Center({
    centerNo: data.centerNo.toUpperCase(),
    description: data.description,
    location: data.location,
    centerChief: data.centerChief,
    treasurer: data.treasurer,
    acctOfficer: data.acctOfficer,
    createdAt: data.createdAt,
  }).save();
  if (!newCenter) {
    throw new CustomError("Failed to create a new center", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `created a center`,
    resource: `center`,
    dataId: newCenter._id,
  });

  return {
    success: true,
    center: newCenter,
  };
};

exports.update = async (filter, data, author) => {
  const updatedCenter = await Center.findOneAndUpdate(
    filter,
    {
      $set: {
        centerNo: data.centerNo.toUpperCase(),
        description: data.description,
        location: data.location,
        centerChief: data.centerChief,
        treasurer: data.treasurer,
        acctOfficer: data.acctOfficer,
        createdAt: data.createdAt,
      },
    },
    { new: true }
  ).exec();
  if (!updatedCenter) {
    throw new CustomError("Failed to update the center", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `updated a center`,
    resource: `center`,
    dataId: updatedCenter._id,
  });

  return { success: true, center: updatedCenter };
};

exports.delete = async (filter, author) => {
  const deletedCenter = await Center.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedCenter.acknowledged || deletedCenter.modifiedCount < 1) {
    throw new CustomError("Failed to delete the center", 500);
  }
  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `deleted a center`,
    resource: `center`,
    dataId: filter._id,
  });

  return { success: true, center: filter._id };
};
