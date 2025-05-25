const CustomError = require("../../utils/custom-error.js");
const Status = require("./status.schema.js");

exports.get_selections = async keyword => {
  const filter = { deletedAt: null, type: new RegExp(keyword, "i") };
  const statuses = await Status.find(filter).lean().exec();
  return {
    success: true,
    statuses,
  };
};

exports.get_options = async () => {
  const filter = { deletedAt: null };
  const options = await Status.find(filter, { label: "$code", value: "$_id", _id: 0 }).lean().exec();
  return {
    success: true,
    statuses: options,
  };
};

exports.get_all = async (limit, page, offset, keyword, sort) => {
  const filter = { deletedAt: null };
  if (keyword) filter.$or = [{ code: new RegExp(keyword, "i") }, { description: new RegExp(keyword, "i") }];

  const query = Status.find(filter);
  if (sort && ["code-asc", "code-desc"].includes(sort)) query.sort({ code: sort === "code-asc" ? 1 : -1 });
  else if (sort && ["description-asc", "description-desc"].includes(sort)) query.sort({ description: sort === "description-asc" ? 1 : -1 });
  else query.sort({ createdAt: -1 });

  const countPromise = Status.countDocuments(filter);
  const statusesPromise = query.skip(offset).limit(limit).exec();

  const [count, statuses] = await Promise.all([countPromise, statusesPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    statuses,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_single = async filter => {
  const status = await Status.findOne(filter).exec();
  if (!status) {
    throw new CustomError("Status not found", 404);
  }
  return { success: true, status };
};

exports.create = async data => {
  const newStatus = await new Status({
    code: data.code.toUpperCase(),
    description: data.description,
  }).save();
  if (!newStatus) {
    throw new CustomError("Failed to create a new status", 500);
  }
  return {
    success: true,
    status: newStatus,
  };
};

exports.update = async (filter, data) => {
  const updatedStatus = await Status.findOneAndUpdate(
    filter,
    {
      $set: {
        code: data.code.toUpperCase(),
        description: data.description,
      },
    },
    { new: true }
  ).exec();
  if (!updatedStatus) {
    throw new CustomError("Failed to update the status", 500);
  }
  return { success: true, status: updatedStatus };
};

exports.delete = async filter => {
  const deletedStatus = await Status.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedStatus.acknowledged || deletedStatus.modifiedCount < 1) {
    throw new CustomError("Failed to delete the status", 500);
  }
  return { success: true, status: filter._id };
};
