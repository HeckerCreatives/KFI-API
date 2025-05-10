const CustomError = require("../../utils/custom-error.js");
const Beneficiary = require("./beneficiary.schema.js");

exports.get_all = async (limit, page, offset, keyword) => {
  const filter = { deletedAt: null };
  if (keyword) filter.centerCode = new RegExp(keyword, "i");

  const countPromise = Beneficiary.countDocuments(filter);
  const beneficiariesPromise = Beneficiary.find(filter).skip(offset).limit(limit).exec();

  const [count, beneficiaries] = await Promise.all([countPromise, beneficiariesPromise]);

  const hasNextPage = count > offset + limit;
  const hasPrevPage = page > 1;
  const totalPages = Math.ceil(count / limit);

  return {
    success: true,
    beneficiaries,
    hasNextPage,
    hasPrevPage,
    totalPages,
  };
};

exports.get_single = async filter => {
  const beneficiary = await Beneficiary.findOne(filter).exec();
  if (!beneficiary) {
    throw new CustomError("Beneficiary not found", 404);
  }
  return { success: true, beneficiary };
};

exports.create = async data => {
  const newBeneficiary = await new Beneficiary({
    owner: data.owner,
    name: data.name,
    relationship: data.relationship,
  }).save();
  if (!newBeneficiary) {
    throw new CustomError("Failed to create a new beneficiary", 500);
  }
  return {
    success: true,
    beneficiary: newBeneficiary,
  };
};

exports.update = async (filter, data) => {
  const updatedBeneficiary = await Beneficiary.findOneAndUpdate(
    filter,
    {
      $set: {
        owner: data.owner,
        name: data.name,
        relationship: data.relationship,
      },
    },
    { new: true }
  ).exec();
  if (!updatedBeneficiary) {
    throw new CustomError("Failed to update the beneficiary", 500);
  }
  return { success: true, beneficiary: updatedBeneficiary };
};

exports.delete = async filter => {
  const deletedBeneficiary = await Beneficiary.updateOne(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (!deletedBeneficiary.acknowledged || deletedBeneficiary.modifiedCount < 1) {
    throw new CustomError("Failed to delete the beneficiary", 500);
  }
  return { success: true, beneficiary: filter._id };
};
