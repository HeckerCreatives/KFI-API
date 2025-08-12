const CustomError = require("../../utils/custom-error.js");
const Supplier = require("./supplier.schema.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");

exports.get_selections = async (keyword, limit, page, offset) => {
  const filter = { deletedAt: null, code: new RegExp(keyword, "i") };

  const suppliersPromise = Supplier.find(filter, { code: 1, description: 1 }).skip(offset).limit(limit).lean().exec();
  const countPromise = Supplier.countDocuments(filter);

  const [count, suppliers] = await Promise.all([countPromise, suppliersPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    suppliers,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_all = async (limit, page, offset, keyword, sort) => {
  const filter = { deletedAt: null };
  if (keyword) filter.$or = [{ code: new RegExp(keyword, "i") }, { description: new RegExp(keyword, "i") }];

  const query = Supplier.find(filter);
  if (sort && ["code-asc", "code-desc"].includes(sort)) query.sort({ code: sort === "code-asc" ? 1 : -1 });
  else if (sort && ["description-asc", "description-desc"].includes(sort)) query.sort({ description: sort === "description-asc" ? 1 : -1 });
  else query.sort({ createdAt: -1 });

  const countPromise = Supplier.countDocuments(filter);
  const suppliersPromise = query.skip(offset).limit(limit).exec();

  const [count, suppliers] = await Promise.all([countPromise, suppliersPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    suppliers,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_single = async filter => {
  const supplier = await Supplier.findOne(filter).exec();
  if (!supplier) {
    throw new CustomError("Supplier not found", 404);
  }
  return { success: true, supplier };
};

exports.create = async (data, author) => {
  const newSupplier = await new Supplier({
    code: data.code.toUpperCase(),
    description: data.description,
  }).save();
  if (!newSupplier) {
    throw new CustomError("Failed to create a new supplier", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `created a business supplier`,
    resource: `business supplier`,
    dataId: newSupplier._id,
  });

  return {
    success: true,
    supplier: newSupplier,
  };
};

exports.update = async (filter, data, author) => {
  const updatedSupplier = await Supplier.findOneAndUpdate(
    filter,
    {
      $set: {
        code: data.code.toUpperCase(),
        description: data.description,
      },
    },
    { new: true }
  ).exec();
  if (!updatedSupplier) {
    throw new CustomError("Failed to update the supplier", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `updated a business supplier`,
    resource: `business supplier`,
    dataId: updatedSupplier._id,
  });

  return { success: true, supplier: updatedSupplier };
};

exports.delete = async (filter, author) => {
  const deletedSupplier = await Supplier.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedSupplier.acknowledged || deletedSupplier.modifiedCount < 1) {
    throw new CustomError("Failed to delete the supplier", 500);
  }

  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `deleted a business supplier`,
    resource: `business supplier`,
    dataId: filter._id,
  });

  return { success: true, supplier: filter._id };
};
