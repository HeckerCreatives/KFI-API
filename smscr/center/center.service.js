const CustomError = require("../../utils/custom-error.js");
const Center = require("./center.schema.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");

exports.get_officer = async id => {
  const filter = { _id: id, deletedAt: null };
  const center = await Center.findOne(filter).lean().exec();

  return {
    success: true,
    officer: center.acctOfficer,
  };
};

exports.get_selections = async (keyword, limit, page, offset) => {
  const filter = { deletedAt: null, $or: [{ centerNo: new RegExp(keyword, "i") }, { description: new RegExp(keyword, "i") }] };

  const centersPromise = Center.find(filter, { code: "$centerNo", description: "$description" }).skip(offset).limit(limit).lean().exec();
  const countPromise = Center.countDocuments(filter);

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

exports.print_all = async () => {
  const centers = await Center.aggregate([
    { $match: { deletedAt: null } },
    {
      $lookup: {
        from: "customers",
        let: { centerId: "$_id" },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ["$center", "$$centerId"] }, { $or: [{ $eq: ["$deletedAt", null] }, { $eq: [{ $ifNull: ["$deletedAt", null] }, null] }] }] } } },
        ],
        as: "clients",
      },
    },
    {
      $project: {
        centerNo: 1,
        description: 1,
        location: 1,
        centerChief: 1,
        treasurer: 1,
        acctOfficer: 1,
        activeNew: { $size: { $filter: { input: "$clients", as: "user", cond: { $eq: ["$$user.memberStatus", "Active-New"] } } } },
        activeReturnee: { $size: { $filter: { input: "$clients", as: "user", cond: { $eq: ["$$user.memberStatus", "Active-Returnee"] } } } },
        activeExisting: { $size: { $filter: { input: "$clients", as: "user", cond: { $eq: ["$$user.memberStatus", "Active-Existing"] } } } },
        activePastdue: { $size: { $filter: { input: "$clients", as: "user", cond: { $eq: ["$$user.memberStatus", "Active-PastDue"] } } } },
        resigned: { $size: { $filter: { input: "$clients", as: "user", cond: { $eq: ["$$user.memberStatus", "Active-Resigned"] } } } },
        others: { $size: { $filter: { input: "$clients", as: "user", cond: { $eq: ["$$user.memberStatus", "Others"] } } } },
        total: { $size: "$clients" },
      },
    },
  ]).exec();

  return { success: true, centers };
};
