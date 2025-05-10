const CustomError = require("../../utils/custom-error.js");
const WeeklySavingTime = require("./weekly-saving-time.schema.js");

exports.get_all = async (limit, page, offset, keyword) => {
  const filter = { deletedAt: null };
  if (keyword) filter.code = new RegExp(keyword, "i");

  const countPromise = WeeklySavingTime.countDocuments(filter);
  const weeklySavingTimesPromise = WeeklySavingTime.find(filter).skip(offset).limit(limit).exec();

  const [count, weeklySavingTimes] = await Promise.all([countPromise, weeklySavingTimesPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    weeklySavingTimes,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_single = async filter => {
  const weeklySavingTime = await WeeklySavingTime.findOne(filter).exec();
  if (!weeklySavingTime) {
    throw new CustomError("Weekly saving time not found", 404);
  }
  return { success: true, weeklySavingTime };
};

exports.create = async data => {
  const newWeeklySavingTime = await new WeeklySavingTime({
    week: data.week,
  }).save();
  if (!newWeeklySavingTime) {
    throw new CustomError("Failed to create a new weekly saving time", 500);
  }
  return {
    success: true,
    weeklySavingTime: newWeeklySavingTime,
  };
};

exports.update = async (filter, data) => {
  const updatedWeeklySavingTime = await WeeklySavingTime.findOneAndUpdate(filter, { $set: { week: data.week } }, { new: true }).exec();
  if (!updatedWeeklySavingTime) {
    throw new CustomError("Failed to update the weekly saving time", 500);
  }
  return { success: true, weeklySavingTime: updatedWeeklySavingTime };
};

exports.delete = async filter => {
  const deletedWeeklySavingTime = await WeeklySavingTime.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedWeeklySavingTime.acknowledged || deletedWeeklySavingTime.modifiedCount < 1) {
    throw new CustomError("Failed to delete the weekly saving time", 500);
  }
  return { success: true, businessType: filter._id };
};
