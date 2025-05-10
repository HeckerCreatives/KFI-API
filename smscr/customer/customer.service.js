const Customer = require("./customer.schema.js");
const CustomError = require("../../utils/custom-error.js");

exports.get_all = async (limit, page, offset, keyword) => {
  const filter = { deletedAt: null };
  if (keyword) filter.name = new RegExp(keyword, "i");

  const countPromise = Customer.countDocuments(filter);
  const customersPromise = Customer.find(filter).skip(offset).limit(limit).exec();

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
  const customer = await Customer.findOne(filter).exec();
  if (!customer) {
    throw new CustomError("Customer not found", 404);
  }
  return { success: true, customer };
};

exports.create = async data => {
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
    acctNumber: data.acctNumber,
    sex: data.sex,
    dateResigned: data.dateResigned,
    newStatus: data.newStatus,
    reason: data.reason,
    parent: data.parent,
  }).save();
  if (!newCustomer) {
    throw new CustomError("Failed to create a new customer", 500);
  }

  return {
    success: true,
    customer: newCustomer,
  };
};

exports.update = async (filter, data) => {
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
        acctNumber: data.acctNumber,
        sex: data.sex,
        dateResigned: data.dateResigned,
        newStatus: data.newStatus,
        reason: data.reason,
        parent: data.parent,
      },
    },
    { new: true }
  ).exec();
  if (!updatedCustomer) {
    throw new CustomError("Failed to update the customer", 500);
  }
  return { success: true, customer: updatedCustomer };
};

exports.delete = async filter => {
  const deletedCustomer = await Customer.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedCustomer.acknowledged || deletedCustomer.modifiedCount < 1) {
    throw new CustomError("Failed to delete the customer", 500);
  }
  return { success: true, customer: filter._id };
};
