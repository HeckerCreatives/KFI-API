const Customer = require("./customer.schema.js");
const CustomError = require("../../utils/custom-error.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const { default: mongoose } = require("mongoose");
const { wallets } = require("../../constants/wallets.js");
const Wallet = require("../wallets/wallet.schema.js");

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
