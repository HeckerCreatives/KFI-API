const CustomError = require("../../utils/custom-error.js");
const DamayanFund = require("./damayan-fund.schema.js");

exports.get_all = async (limit, page, offset, keyword) => {
  const filter = { deletedAt: null };
  if (keyword) filter.code = new RegExp(keyword, "i");

  const countPromise = DamayanFund.countDocuments(filter);
  const damayanFundsPromise = DamayanFund.find(filter).skip(offset).limit(limit).exec();

  const [count, damayanFunds] = await Promise.all([countPromise, damayanFundsPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    damayanFunds,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_single = async filter => {
  const damayanFund = await DamayanFund.findOne(filter).exec();
  if (!damayanFund) {
    throw new CustomError("Damayan fund not found", 404);
  }
  return { success: true, damayanFund };
};

exports.create = async data => {
  const newDamayanFund = await new DamayanFund({
    jvNo: data.jvNo,
    supplier: data.supplier,
    nature: data.nature,
    remarks: data.remarks,
    date: data.date,
    acctMonth: data.acctMonth,
    acctYear: data.acctYear,
    checkNo: data.checkNo,
    checkDate: data.checkDate,
    bankCode: data.bankCode,
    amount: data.amount,
  }).save();
  if (!newDamayanFund) {
    throw new CustomError("Failed to create a new damayan fund", 500);
  }
  return {
    success: true,
    damayanFund: newDamayanFund,
  };
};

exports.update = async (filter, data) => {
  const updatedDamayanFund = await DamayanFund.findOneAndUpdate(
    filter,
    {
      $set: {
        jvNo: data.jvNo,
        supplier: data.supplier,
        nature: data.nature,
        remarks: data.remarks,
        date: data.date,
        acctMonth: data.acctMonth,
        acctYear: data.acctYear,
        checkNo: data.checkNo,
        checkDate: data.checkDate,
        bankCode: data.bankCode,
        amount: data.amount,
      },
    },
    { new: true }
  ).exec();
  if (!updatedDamayanFund) {
    throw new CustomError("Failed to update the damayan fund", 500);
  }
  return { success: true, damayanFund: updatedDamayanFund };
};

exports.delete = async filter => {
  const deletedDamayanFund = await DamayanFund.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedDamayanFund.acknowledged || deletedDamayanFund.modifiedCount < 1) {
    throw new CustomError("Failed to delete the damayan fund", 500);
  }
  return { success: true, damayanFund: filter._id };
};
