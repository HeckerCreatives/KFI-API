const CustomError = require("../../utils/custom-error.js");
const WeeklySaving = require("./weekly-saving.schema.js");

exports.get_all = async (limit, page, offset, keyword, sort) => {
  const filter = { deletedAt: null };
  const query = WeeklySaving.find(filter);
  if (sort && ["from-asc", "from-desc"].includes(sort)) query.sort({ rangeAmountFrom: sort === "from-asc" ? 1 : -1 });
  else if (sort && ["to-asc", "to-desc"].includes(sort)) query.sort({ rangeAmountTo: sort === "description-asc" ? 1 : -1 });
  else query.sort({ createdAt: -1 });

  const countPromise = WeeklySaving.countDocuments(filter);
  const weeklySavingsPromise = query.skip(offset).limit(limit).exec();

  const [count, weelySavings] = await Promise.all([countPromise, weeklySavingsPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    weelySavings,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_single = async filter => {
  const weeklySaving = await WeeklySaving.findOne(filter).exec();
  if (!weeklySaving) {
    throw new CustomError("Weekly saving not found", 404);
  }
  return { success: true, weeklySaving };
};

exports.create = async data => {
  const newWeeklySaving = await new WeeklySaving({
    rangeAmountFrom: data.rangeAmountFrom,
    rangeAmountTo: data.rangeAmountTo,
    weeklySavingsFund: data.weeklySavingsFund,
  }).save();
  if (!newWeeklySaving) {
    throw new CustomError("Failed to create a weekly saving", 500);
  }
  return {
    success: true,
    weeklySaving: newWeeklySaving,
  };
};

exports.update = async (filter, data) => {
  const updatedWeeklySaving = await WeeklySaving.findOneAndUpdate(
    filter,
    {
      $set: {
        rangeAmountFrom: data.rangeAmountFrom,
        rangeAmountTo: data.rangeAmountTo,
        weeklySavingsFund: data.weeklySavingsFund,
      },
    },
    { new: true }
  ).exec();
  if (!updatedWeeklySaving) {
    throw new CustomError("Failed to update the weekly saving", 500);
  }
  return { success: true, weeklySaving: updatedWeeklySaving };
};

exports.delete = async filter => {
  const deletedWeeklySaving = await WeeklySaving.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedWeeklySaving.acknowledged || deletedWeeklySaving.modifiedCount < 1) {
    throw new CustomError("Failed to delete the weekly saving", 500);
  }
  return { success: true, weeklySaving: filter._id };
};
