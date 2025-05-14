const CustomError = require("../../utils/custom-error.js");
const Nature = require("./nature.schema.js");

exports.get_all = async (limit, page, offset, keyword, sort) => {
  const filter = { deletedAt: null };
  if (keyword) filter.code = new RegExp(keyword, "i");

  const query = Nature.find(filter);
  if (sort && ["type-asc", "type-desc"].includes(sort)) query.sort({ type: sort === "type-asc" ? 1 : -1 });
  else query.sort({ createdAt: -1 });

  const countPromise = Nature.countDocuments(filter);
  const naturesPromise = query.skip(offset).limit(limit).exec();

  const [count, natures] = await Promise.all([countPromise, naturesPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    natures,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_single = async filter => {
  const nature = await Nature.findOne(filter).exec();
  if (!nature) {
    throw new CustomError("Nature not found", 404);
  }
  return { success: true, nature };
};

exports.create = async data => {
  const newNature = await new Nature({
    type: data.type,
  }).save();
  if (!newNature) {
    throw new CustomError("Failed to create a new nature", 500);
  }
  return {
    success: true,
    nature: newNature,
  };
};

exports.update = async (filter, data) => {
  const updatedNature = await Nature.findOneAndUpdate(filter, { $set: { type: data.type } }, { new: true }).exec();
  if (!updatedNature) {
    throw new CustomError("Failed to update the nature", 500);
  }
  return { success: true, nature: updatedNature };
};

exports.delete = async filter => {
  const deletedNature = await Nature.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedNature.acknowledged || deletedNature.modifiedCount < 1) {
    throw new CustomError("Failed to delete the nature", 500);
  }
  return { success: true, nature: filter._id };
};
