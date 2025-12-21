const BeginningBalance = require("../beginning-balance/beginning-balance.schema");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema");

exports.print_activity_report = async (dateFrom, dateTo, codeFrom, codeTo, withBeginningBalance, year) => {
  let beginningBalance = null;

  const codes = await ChartOfAccount.find({ $and: [{ code: { $gte: codeFrom } }, { code: { $lte: codeTo } }] })
    .collation({ locale: "en", numericOrdering: true })
    .sort({ code: 1 })
    .lean()
    .exec();

  const codeIds = codes.map(code => code._id);

  if (withBeginningBalance) {
    beginningBalance = await BeginningBalance.findOne({ year, deletedAt: null }).lean().exec();
  }

  const pipelines = [{ $match: { _id: { $in: codeIds } } }, { $sort: { code: 1 } }, ...accumulatedEntries(dateFrom, dateTo, codeIds)];

  const entries = await ChartOfAccount.aggregate(pipelines).exec();

  return { entries, beginningBalance };
};

exports.print_audit_trail = async (dateFrom, dateTo, codeFrom, codeTo, withBeginningBalance, year) => {
  let beginningBalance = null;

  const codes = await ChartOfAccount.find({ $and: [{ code: { $gte: codeFrom } }, { code: { $lte: codeTo } }] })
    .collation({ locale: "en", numericOrdering: true })
    .sort({ code: 1 })
    .lean()
    .exec();

  const codeIds = codes.map(code => code._id);

  if (withBeginningBalance) {
    beginningBalance = await BeginningBalance.findOne({ year, deletedAt: null }).lean().exec();
  }

  const pipelines = [{ $match: { _id: { $in: codeIds } } }, { $sort: { code: 1 } }, ...accumulatedEntries(dateFrom, dateTo, codeIds)];
  const entries = await ChartOfAccount.aggregate(pipelines).exec();

  return { entries, beginningBalance };
};

// SERVICE UTILS

const entryReferences = [
  { collection: "entries", reference: "transactions", field: "transaction", alias: "lre" },
  { collection: "journalvoucherentries", reference: "journalvouchers", field: "journalVoucher", alias: "jve" },
  { collection: "expensevoucherentries", reference: "expensevouchers", field: "expenseVoucher", alias: "eve" },
  { collection: "acknowledgemententries", reference: "acknowledgements", field: "acknowledgement", alias: "ore" },
  { collection: "releaseentries", reference: "releases", field: "release", alias: "ace" },
  { collection: "emergencyloanentries", reference: "emergencyloans", field: "emergencyLoan", alias: "ele" },
  { collection: "damayanfundentries", reference: "damayanfunds", field: "damayanFund", alias: "dfe" },
];

const accumulatedEntries = (dateFrom, dateTo, codes) => {
  const entryPipelines = [];
  entryReferences.map(ref => {
    entryPipelines.push({ ...generateAccumulatedEntryPipelines(ref.collection, { dateFrom, dateTo, reference: ref.reference, field: ref.field, alias: ref.alias }) });
  });
  entryPipelines.push({ $addFields: { entries: { $concatArrays: ["$lre", "$jve", "$eve", "$ore", "$ace", "$ele", "$dfe"] } } });
  entryPipelines.push({ $project: { code: 1, description: 1, entries: 1 } });
  return entryPipelines;
};

const generateAccumulatedEntryPipelines = (collection, config) => {
  const { dateFrom, dateTo, reference, field, alias } = config;

  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);

  return {
    $lookup: {
      from: `${collection}`,
      let: { acctCodeId: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$acctCode", "$$acctCodeId"] } } },
        { $lookup: { from: `${reference}`, foreignField: "_id", localField: `${field}`, as: `${field}` } },
        { $addFields: { [field]: { $arrayElemAt: [`$${field}`, 0] } } },
        { $unwind: `$${field}` },
        { $match: { $expr: { $and: [{ $gte: [`$${field}.date`, startDate] }, { $lte: [`$${field}.date`, endDate] }] } } },
        { $addFields: { date: `$${field}.date`, doc: `$${field}.code`, acctOfficer: { $ifNull: [`$${field}.acctOfficer`, ""] } } },
        { $sort: { date: 1 } },
        { $project: { [field]: 0 } },
      ],
      as: `${alias}`,
    },
  };
};
