const { activeMemberStatuses, inactiveMemberStatuses } = require("../../constants/member-status.js");
const Center = require("../center/center.schema.js");
const Customer = require("../customer/customer.schema.js");
const Entry = require("../transactions/entries/entry.schema.js");
const Transaction = require("../transactions/transaction.schema.js");

exports.dashboard_card_statistics = async () => {
  const total_promise = Customer.countDocuments({ deletedAt: null });
  const total_active_promise = Customer.countDocuments({ deletedAt: null, memberStatus: { $in: activeMemberStatuses } });
  const total_inactive_promise = Customer.countDocuments({ deletedAt: null, memberStatus: { $in: inactiveMemberStatuses } });
  const total_loan_promise = Transaction.aggregate([{ $match: { deletedAt: null } }, { $group: { _id: null, amount: { $sum: "$amount" } } }]);

  const [total, total_active, total_inactive, total_loan] = await Promise.all([total_promise, total_active_promise, total_inactive_promise, total_loan_promise]);

  return {
    totalMembers: total,
    totalActiveMembers: total_active,
    totalInactiveMembers: total_inactive,
    totalLoan: total_loan.length > 0 ? total_loan[0].amount : 0,
  };
};

exports.loans_per_account_officer = async (limit, page, offset, search) => {
  const pipelines = [];
  const filter = { deletedAt: null, $or: [{ acctOfficer: new RegExp(search, "i") }, { description: new RegExp(search, "i") }] };

  pipelines.push({ $match: filter });

  pipelines.push({ $skip: offset }, { $limit: limit });

  pipelines.push({
    $lookup: {
      from: "customers",
      let: { centerId: "$_id" },
      pipeline: [{ $match: { $expr: { $eq: ["$center", "$$centerId"] }, $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] } }],
      as: "clients",
    },
  });

  pipelines.push({
    $lookup: {
      from: "entries",
      let: { centerId: "$_id" },
      pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$center", "$$centerId"] }, { $ne: ["$client", null] }] } } }],
      as: "loans",
    },
  });

  pipelines.push({ $project: { acctOfficer: 1, location: 1, description: 1, members: { $size: "$clients" }, loans: { $sum: "$loans.debit" } } });

  const countPromise = Center.countDocuments(filter);
  const loansPromise = Center.aggregate(pipelines);

  const [count, loans] = await Promise.all([countPromise, loansPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    loans,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.recent_loan = async () => {
  const filter = { deletedAt: null, client: { $ne: null } };

  const query = Entry.find(filter)
    .sort("-createdAt")
    .populate({ path: "client", select: "name" })
    .populate({ path: "center", select: "centerNo description" })
    .populate({ path: "acctCode", select: "code description" });

  // const countPromise = Entry.countDocuments(filter);
  const entriesPromise = query.limit(20).lean().exec();
  const [entries] = await Promise.all([entriesPromise]);

  // const hasNextPage = count > offset + limit;
  // const hasPrevPage = page > 1;
  // const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    entries,
  };
};

exports.recent_member = async () => {
  const filter = { deletedAt: null };

  const query = Customer.find(filter)
    .sort("-createdAt")
    .populate({ path: "center", select: "centerNo description" })
    .populate({ path: "business", select: "type" })
    .populate({ path: "beneficiaries" })
    .populate({ path: "children" });
  // const countPromise = Customer.countDocuments(filter);
  const customersPromise = query.limit(20).lean().exec();

  const [customers] = await Promise.all([customersPromise]);

  // const hasNextPage = count > offset + limit;
  // const hasPrevPage = page > 1;
  // const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    customers,
    // hasNextPage,
    // hasPrevPage,
    // totalPages,
  };
};
