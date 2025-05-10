const CustomError = require("../../utils/custom-error.js");
const WeeklySaving = require("./weekly-saving.schema.js");

exports.get_all = async (limit, page, offset, keyword) => {
  const filter = { deletedAt: null };
  if (keyword) filter.code = new RegExp(keyword, "i");

  const countPromise = WeeklySaving.countDocuments(filter);
  const weeklySavingsPromise = WeeklySaving.find(filter).skip(offset).limit(limit).exec();

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
