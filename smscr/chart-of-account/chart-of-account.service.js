const { default: CustomError } = require("../../utils/custom-error.js");
const ChartOfAccount = require("./chart-of-account.schema.js");

exports.get_selections = async keyword => {
  const filter = { deletedAt: null, $or: [{ code: new RegExp(keyword, "i") }, { description: new RegExp(keyword, "i") }] };
  const chartOfAccounts = await ChartOfAccount.find(filter).limit(100).lean().exec();
  return {
    success: true,
    chartOfAccounts,
  };
};

exports.get_all = async (limit, page, offset, keyword, sort) => {
  const filter = { deletedAt: null };
  if (keyword) filter.$or = [{ code: new RegExp(keyword, "i") }, { description: new RegExp(keyword, "i") }];
  const query = ChartOfAccount.find(filter).populate({ path: "groupOfAccount" });
  if (sort && ["code-asc", "code-desc"].includes(sort)) query.sort({ code: sort === "code-asc" ? 1 : -1 });
  else if (sort && ["description-asc", "description-desc"].includes(sort)) query.sort({ description: sort === "description-asc" ? 1 : -1 });
  else query.sort({ createdAt: -1 });

  const countPromise = ChartOfAccount.countDocuments(filter);
  const chartOfAccountsPromise = query.skip(offset).limit(limit).exec();

  const [count, chartOfAccounts] = await Promise.all([countPromise, chartOfAccountsPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    chartOfAccounts,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_single = async filter => {
  const chartOfAccount = await ChartOfAccount.findOne(filter).exec();
  if (!chartOfAccount) {
    throw new CustomError("Chart of account not found", 404);
  }
  return { success: true, chartOfAccount };
};

exports.create = async data => {
  const newChartOfAccount = await new ChartOfAccount({
    code: data.code.toUpperCase(),
    description: data.description,
    classification: data.classification,
    nature: data.nature,
    groupAccount: data.groupAccount,
    closeAccount: data.closeAccount,
    fsCode: data.fsCode,
    mainAcctNo: data.mainAcctNo,
    subAcctNo: data.subAcctNo,
    branchCode: data.branchCode,
    sequence: data.sequence,
    parent: data.parent,
    indention: data.indention,
    detailed: data.detailed,
  }).save();
  if (!newChartOfAccount) {
    throw new CustomError("Failed to create a new chart of account", 500);
  }
  return { success: true, chartOfAccount: newChartOfAccount };
};

exports.update = async (filter, data) => {
  const updatedChartOfAccount = await ChartOfAccount.findOneAndUpdate(
    filter,
    {
      $set: {
        code: data.code.toUpperCase(),
        description: data.description,
        classification: data.classification,
        nature: data.nature,
        groupAccount: data.groupAccount,
        closeAccount: data.closeAccount,
        fsCode: data.fsCode,
        mainAcctNo: data.mainAcctNo,
        subAcctNo: data.subAcctNo,
        branchCode: data.branchCode,
        sequence: data.sequence,
        parent: data.parent,
        indention: data.indention,
        detailed: data.detailed,
      },
    },
    { new: true }
  ).exec();
  if (!updatedChartOfAccount) {
    throw new CustomError("Failed to update the chart of account", 500);
  }
  return { success: true, chartOfAccount: updatedChartOfAccount };
};

exports.delete = async filter => {
  const deletedChartOfAccount = await ChartOfAccount.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedChartOfAccount.acknowledged || deletedChartOfAccount.modifiedCount < 1) {
    throw new CustomError("Failed to delete the chart of account", 500);
  }
  return { success: true, chartOfAccount: filter._id };
};

exports.link = async (filter, data) => {
  const updatedChartOfAccount = await ChartOfAccount.findOneAndUpdate(filter, { $set: { groupOfAccount: data.groupOfAccount } }, { new: true })
    .populate({ path: "groupOfAccount" })
    .exec();
  if (!updatedChartOfAccount) {
    throw new CustomError("Failed to link the group of account", 500);
  }
  return { success: true, chartOfAccount: updatedChartOfAccount };
};
