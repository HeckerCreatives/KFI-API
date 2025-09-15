const Customer = require("./customer.schema.js");
const CustomError = require("../../utils/custom-error.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const { default: mongoose } = require("mongoose");
const { wallets } = require("../../constants/wallets.js");
const Wallet = require("../wallets/wallet.schema.js");

exports.get_clients_by_center = async center => {
  const filter = { deletedAt: null, center };
  const clients = await Customer.find(filter).select("name").lean().exec();
  return {
    success: true,
    clients,
  };
};

exports.get_clients_list = async (keyword, limit, page, offset) => {
  const filter = { deletedAt: null, name: new RegExp(keyword, "i") };

  const clientsPromise = Customer.find(filter).select("name").skip(offset).limit(limit).lean().exec();
  const countPromise = Customer.countDocuments(filter);

  const [count, clients] = await Promise.all([countPromise, clientsPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    clients,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_client_stats = async () => {
  const totalPromise = Customer.countDocuments({ deletedAt: null }).exec();
  const resignedPromise = Customer.countDocuments({ deletedAt: null, memberStatus: "Resigned" }).exec();
  const onLeavePromise = Customer.countDocuments({ deletedAt: null, memberStatus: "Active On-Leave" }).exec();
  const existingPromise = Customer.countDocuments({ deletedAt: null, memberStatus: "Active-Existing" }).exec();
  const newPromise = Customer.countDocuments({ deletedAt: null, memberStatus: "Active-New" }).exec();
  const pastDuePromise = Customer.countDocuments({ deletedAt: null, memberStatus: "Active-PastDue" }).exec();
  const returneePromise = Customer.countDocuments({ deletedAt: null, memberStatus: "Active-Returnee" }).exec();

  const [totalClient, resigned, activeOnLeave, activeExisting, activeNew, activePastDue, activeReturnee] = await Promise.all([
    totalPromise,
    resignedPromise,
    onLeavePromise,
    existingPromise,
    newPromise,
    pastDuePromise,
    returneePromise,
  ]);

  return {
    success: true,
    totalClient,
    resigned,
    activeOnLeave,
    activeExisting,
    activeNew,
    activePastDue,
    activeReturnee,
  };
};

exports.get_selections = async (keyword, center, limit, page, offset) => {
  const filter = { deletedAt: null, name: new RegExp(keyword, "i") };
  if (center) filter.center = center;

  const clientsPromise = Customer.find(filter, { name: 1, acctNumber: 1, center: 1 }).populate({ path: "center", select: "-_id centerNo" }).skip(offset).limit(limit).lean().exec();
  const countPromise = Customer.countDocuments(filter);

  const [count, clients] = await Promise.all([countPromise, clientsPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    clients,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_all = async (limit, page, offset, keyword, sort) => {
  const filter = { deletedAt: null };
  if (keyword) filter.$or = [{ acctNumber: new RegExp(keyword, "i") }, { name: new RegExp(keyword, "i") }];

  const query = Customer.find(filter);
  if (sort && ["acctno-asc", "acctno-desc"].includes(sort)) query.sort({ acctNumber: sort === "acctno-asc" ? 1 : -1 });
  else if (sort && ["name-asc", "name-desc"].includes(sort)) query.sort({ name: sort === "name-asc" ? 1 : -1 });
  else query.sort({ createdAt: -1 });

  const countPromise = Customer.countDocuments(filter);
  const customersPromise = query
    .populate({ path: "center", select: "centerNo" })
    .populate({ path: "business", select: "type" })
    .populate({ path: "beneficiaries" })
    .populate({ path: "children" })
    .skip(offset)
    .limit(limit)
    .lean()
    .exec();

  const [count, customers] = await Promise.all([countPromise, customersPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    customers,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_single = async filter => {
  const customer = await Customer.findOne(filter)
    .populate({ path: "center", select: "centerNo" })
    .populate({ path: "business", select: "type" })
    .populate({ path: "beneficiaries" })
    .populate({ path: "children" })
    .exec();
  if (!customer) {
    throw new CustomError("Customer not found", 404);
  }
  return { success: true, customer };
};

exports.create = async (data, author) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const newCustomer = await new Customer({
      name: data.name,
      address: data.address,
      city: data.city,
      telNo: data.telNo,
      mobileNo: data.mobileNo,
      zipCode: data.zipCode,
      birthdate: data.birthdate,
      birthplace: data.birthplace,
      spouse: data.spouse,
      memberStatus: data.memberStatus,
      civilStatus: data.civilStatus,
      center: data.center,
      dateRelease: data.dateRelease,
      business: data.business,
      position: data.position,
      age: data.age,
      acctNumber: data.acctNumber.toUpperCase(),
      acctOfficer: data.acctOfficer,
      sex: data.sex,
      dateResigned: data.dateResigned,
      reason: data.reason,
      parent: data.parent,
      beneficiaries: data.beneficiary,
      children: data.children,
    }).save({ session });

    if (!newCustomer) {
      throw new CustomError("Failed to create a new customer", 500);
    }

    const clientWallets = wallets.map(wallet => ({
      owner: newCustomer._id,
      type: wallet,
      amount: 0,
    }));

    const createdWallets = await Wallet.insertMany(clientWallets, { session });
    if (createdWallets.length !== wallets.length) {
      throw new CustomError("Failed to create a new customer", 500);
    }

    const customer = await Customer.findOne({ _id: newCustomer._id })
      .populate({ path: "center", select: "centerNo" })
      .populate({ path: "business", select: "type" })
      .populate({ path: "beneficiaries" })
      .populate({ path: "children" })
      .session(session)
      .lean()
      .exec();

    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `created a client`,
      resource: `clients`,
      dataId: newCustomer._id,
      session,
    });

    await session.commitTransaction();

    return {
      success: true,
      customer,
    };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to create a client", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.update = async (filter, data, author) => {
  const updatedCustomer = await Customer.findOneAndUpdate(
    filter,
    {
      $set: {
        name: data.name,
        address: data.address,
        city: data.city,
        telNo: data.telNo,
        mobileNo: data.mobileNo,
        zipCode: data.zipCode,
        birthdate: data.birthdate,
        birthplace: data.birthplace,
        spouse: data.spouse,
        memberStatus: data.memberStatus,
        civilStatus: data.civilStatus,
        center: data.center,
        dateRelease: data.dateRelease,
        business: data.business,
        position: data.position,
        age: data.age,
        acctNumber: data.acctNumber.toUpperCase(),
        acctOfficer: data.acctOfficer,
        sex: data.sex,
        dateResigned: data.dateResigned,
        reason: data.reason,
        parent: data.parent,
        beneficiaries: data.beneficiary,
        children: data.children,
      },
    },
    { new: true }
  )
    .populate({ path: "center", select: "centerNo" })
    .populate({ path: "business", select: "type" })
    .exec();
  if (!updatedCustomer) {
    throw new CustomError("Failed to update the customer", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `updated a client`,
    resource: `clients`,
    dataId: updatedCustomer._id,
  });

  return { success: true, customer: updatedCustomer };
};

exports.delete = async (filter, author) => {
  const deletedCustomer = await Customer.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedCustomer.acknowledged || deletedCustomer.modifiedCount < 1) {
    throw new CustomError("Failed to delete the customer", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `deleted a client`,
    resource: `clients`,
    dataId: filter._id,
  });

  return { success: true, customer: filter._id };
};

exports.printAll = async filter => {
  const pipelines = [];

  pipelines.push({ $match: filter });

  pipelines.push({ $lookup: { from: "businesstypes", localField: "business", foreignField: "_id", as: "business" } });

  pipelines.push({ $lookup: { from: "centers", localField: "center", foreignField: "_id", as: "center" } });

  pipelines.push({
    $lookup: { from: "entries", let: { lrId: "$_id" }, pipeline: [{ $match: { $expr: { $eq: ["$client", "$$lrId"] } } }, { $sort: { cycle: -1 } }], as: "entries" },
  });

  pipelines.push({
    $addFields: {
      business: { $arrayElemAt: ["$business", 0] },
      center: { $arrayElemAt: ["$center", 0] },
      entries: { $arrayElemAt: ["$entries", 0] },
      totalLoan: { $sum: "$entries.debit" },
    },
  });

  pipelines.push({ $group: { _id: "$center._id", clients: { $push: "$$ROOT" }, count: { $sum: 1 } } });
  pipelines.push({ $lookup: { from: "centers", localField: "_id", foreignField: "_id", as: "_id" } });

  pipelines.push({
    $addFields: {
      _id: { $arrayElemAt: ["$_id", 0] },
    },
  });

  pipelines.push({ $sort: { "_id.centerNo": 1 } });

  const customers = await Customer.aggregate(pipelines).exec();

  return customers;
};
