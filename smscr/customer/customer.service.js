const Customer = require("./customer.schema.js");
const CustomError = require("../../utils/custom-error.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");

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
    .populate({ path: "groupNumber" })
    .skip(offset)
    .limit(limit)
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
    .populate({ path: "groupNumber" })
    .exec();
  if (!customer) {
    throw new CustomError("Customer not found", 404);
  }
  return { success: true, customer };
};

exports.create = async (data, author) => {
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
    groupNumber: data.groupNumber,
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
    newStatus: data.newStatus,
    reason: data.reason,
    parent: data.parent,
  }).save();

  if (!newCustomer) {
    throw new CustomError("Failed to create a new customer", 500);
  }

  const customer = await this.get_single({ _id: newCustomer._id });

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `created a client`,
    resource: `clients`,
    dataId: newCustomer._id,
  });

  return {
    success: true,
    customer,
  };
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
        groupNumber: data.groupNumber,
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
        newStatus: data.newStatus,
        reason: data.reason,
        parent: data.parent,
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
