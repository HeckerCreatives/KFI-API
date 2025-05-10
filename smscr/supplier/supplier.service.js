const CustomError = require("../../utils/custom-error.js");
const Supplier = require("./supplier.schema.js");

exports.get_all = async (limit, page, offset, keyword) => {
  const filter = { deletedAt: null };
  if (keyword) filter.code = new RegExp(keyword, "i");

  const countPromise = Supplier.countDocuments(filter);
  const suppliersPromise = Supplier.find(filter).skip(offset).limit(limit).exec();

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

exports.create = async data => {
  const newSupplier = await new Supplier({
    code: data.code.toUpperCase(),
    description: data.description,
  }).save();
  if (!newSupplier) {
    throw new CustomError("Failed to create a new supplier", 500);
  }
  return {
    success: true,
    supplier: newSupplier,
  };
};

exports.update = async (filter, data) => {
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
  return { success: true, supplier: updatedSupplier };
};

exports.delete = async filter => {
  const deletedSupplier = await Supplier.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedSupplier.acknowledged || deletedSupplier.modifiedCount < 1) {
    throw new CustomError("Failed to delete the supplier", 500);
  }
  return { success: true, supplier: filter._id };
};
