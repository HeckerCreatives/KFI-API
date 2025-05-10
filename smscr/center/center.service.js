const CustomError = require("../../utils/custom-error.js");
const Center = require("./center.schema.js");

exports.get_all = async (limit, page, offset, keyword) => {
  const filter = { deletedAt: null };
  if (keyword) filter.centerCode = new RegExp(keyword, "i");

  const countPromise = Center.countDocuments(filter);
  const centersPromise = Center.find(filter).skip(offset).limit(limit).exec();

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

exports.create = async data => {
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
  return {
    success: true,
    center: newCenter,
  };
};

exports.update = async (filter, data) => {
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
  return { success: true, center: updatedCenter };
};

exports.delete = async filter => {
  const deletedCenter = await Center.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedCenter.acknowledged || deletedCenter.modifiedCount < 1) {
    throw new CustomError("Failed to delete the center", 500);
  }
  return { success: true, center: filter._id };
};
