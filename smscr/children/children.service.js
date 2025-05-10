const CustomError = require("../../utils/custom-error.js");
const Children = require("./children.schema.js");

exports.get_all = async (limit, page, offset, keyword) => {
  const filter = { deletedAt: null };
  if (keyword) filter.centerCode = new RegExp(keyword, "i");

  const countPromise = Children.countDocuments(filter);
  const childrenPromise = Children.find(filter).skip(offset).limit(limit).exec();

  const [count, children] = await Promise.all([countPromise, childrenPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    children,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_single = async filter => {
  const child = await Children.findOne(filter).exec();
  if (!child) {
    throw new CustomError("Child not found", 404);
  }
  return { success: true, child };
};

exports.create = async data => {
  const newChild = await new Children({
    owner: data.owner,
    name: data.name,
  }).save();
  if (!newChild) {
    throw new CustomError("Failed to create a new child", 500);
  }
  return {
    success: true,
    child: newChild,
  };
};

exports.update = async (filter, data) => {
  const updatedChild = await Children.findOneAndUpdate(
    filter,
    {
      $set: {
        owner: data.owner,
        name: data.name,
      },
    },
    { new: true }
  ).exec();
  if (!updatedChild) {
    throw new CustomError("Failed to update the child", 500);
  }
  return { success: true, child: updatedChild };
};

exports.delete = async filter => {
  const deletedChild = await Children.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedChild.acknowledged || deletedChild.modifiedCount < 1) {
    throw new CustomError("Failed to delete the child", 500);
  }
  return { success: true, child: filter._id };
};
