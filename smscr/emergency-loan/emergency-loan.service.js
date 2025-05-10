const CustomError = require("../../utils/custom-error.js");
const EmergencyLoan = require("./emergency-loan.schema.js");

exports.get_all = async (limit, page, offset, keyword) => {
  const filter = { deletedAt: null };
  if (keyword) filter.code = new RegExp(keyword, "i");

  const countPromise = EmergencyLoan.countDocuments(filter);
  const emergencyLoansPromise = EmergencyLoan.find(filter).skip(offset).limit(limit).exec();

  const [count, emergencyLoans] = await Promise.all([countPromise, emergencyLoansPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    emergencyLoans,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_single = async filter => {
  const emergencyLoan = await EmergencyLoan.findOne(filter).exec();
  if (!emergencyLoan) {
    throw new CustomError("Emergency loan not found", 404);
  }
  return { success: true, emergencyLoan };
};

exports.create = async data => {
  const newEmergencyLoan = await new EmergencyLoan({
    cvNo: data.cvNo,
    supplier: data.supplier,
    date: data.date,
    acctMonth: data.acctMonth,
    acctYear: data.acctYear,
    checkNo: data.checkNo,
    checkDate: data.checkDate,
    bankCode: data.bankCode,
    amount: data.amount,
    remarks: data.remarks,
  }).save();
  if (!newEmergencyLoan) {
    throw new CustomError("Failed to create a new emergency loan", 500);
  }
  return {
    success: true,
    emergencyLoan: newEmergencyLoan,
  };
};

exports.update = async (filter, data) => {
  const updatedEmergencyLoan = await EmergencyLoan.findOneAndUpdate(
    filter,
    {
      $set: {
        cvNo: data.cvNo,
        supplier: data.supplier,
        date: data.date,
        acctMonth: data.acctMonth,
        acctYear: data.acctYear,
        checkNo: data.checkNo,
        checkDate: data.checkDate,
        bankCode: data.bankCode,
        amount: data.amount,
        remarks: data.remarks,
      },
    },
    { new: true }
  ).exec();
  if (!updatedEmergencyLoan) {
    throw new CustomError("Failed to update the emergency loan", 500);
  }
  return { success: true, emergencyLoan: updatedEmergencyLoan };
};

exports.delete = async filter => {
  const deletedEmergencyLoan = await EmergencyLoan.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedEmergencyLoan.acknowledged || deletedEmergencyLoan.modifiedCount < 1) {
    throw new CustomError("Failed to delete the expense voucher", 500);
  }
  return { success: true, emergencyLoan: filter._id };
};
