const { default: mongoose } = require("mongoose");
const Acknowledgement = require("../acknowledgement/acknowlegement.schema");
const AcknowledgementEntry = require("../acknowledgement/entries/acknowledgement-entries.schema");
const Bank = require("../banks/bank.schema");
const BusinessType = require("../business-type/business-type.schema");
const Center = require("../center/center.schema");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema");
const Customer = require("../customer/customer.schema");
const DamayanFund = require("../damayan-fund/damayan-fund.schema");
const DamayanFundEntry = require("../damayan-fund/entries/damayan-fund-entries.schema");
const EmergencyLoan = require("../emergency-loan/emergency-loan.schema");
const EmergencyLoanEntry = require("../emergency-loan/entries/emergency-loan-entry.schema");
const ExpenseVoucherEntry = require("../expense-voucher/entries/expense-voucher-entries.schema");
const ExpenseVoucher = require("../expense-voucher/expense-voucher.schema");
const JournalVoucherEntry = require("../journal-voucher/entries/journal-voucher-entries.schema");
const JournalVoucher = require("../journal-voucher/journal-voucher.schema");
const LoanCode = require("../loan-code/loan-code.schema");
const Loan = require("../loan/loan.schema");
const Nature = require("../nature/nature.schema");
const PaymentSchedule = require("../payment-schedules/payment-schedule.schema");
const ReleaseEntry = require("../release/entries/release-entries.schema");
const Release = require("../release/release.schema");
const Supplier = require("../supplier/supplier.schema");
const LoanReleaseEntryParam = require("../system-parameters/loan-release-entry-param.schema");
const SignatureParam = require("../system-parameters/signature-param");
const Entry = require("../transactions/entries/entry.schema");
const Transaction = require("../transactions/transaction.schema");
const CustomError = require("../../utils/custom-error");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const WeeklySaving = require("../weekly-saving/weekly-saving.schema.js");
const GroupAccount = require("../group-account/group-account.schema.js");
const { createLoanReleasesHelper, updateLoanReleasesHelper, deleteLoanReleasesHelper } = require("./helpers/sync.loan-release.helper.js");
const { createJournalVoucherHelper, updateJournalVoucherHelper, deleteJournalVoucherHelper } = require("./helpers/sync.journal-voucher.helper.js");
const { createExpenseVoucherHelper, updateExpenseVoucherHelper, deleteExpenseVoucherHelper } = require("./helpers/sync.expense-voucher.helper.js");
const { createOfficialReceiptHelper, updateOfficialReceiptHelper, deleteOfficialReceiptHelper } = require("./helpers/sync.official-receipt.helper.js");
const {
  createAcknowledgemenetReceiptsHelper,
  updateAcknowledgemenetReceiptsHelper,
  deleteAcknowledgemenetReceiptsHelper,
} = require("./helpers/sync.acknowledgement-receipt.helper.js");
const { createDamayanFundsHelper, updateDamayanFundsHelper, deleteDamayanFundsHelper } = require("./helpers/sync.damayan-fund.helper.js");
const { createEmergencyLoansHelper, updateEmergencyLoansHelper, deleteEmergencyLoansHelper } = require("./helpers/sync.emergency-loan.helper.js");
const { createClientsHelper, updateClientsHelper, deleteClientsHelper } = require("./helpers/sync.clients.helper.js");

exports.download_banks = async () => {
  const pipelines = [];
  pipelines.push({ $match: { deletedAt: null } });
  pipelines.push({ $addFields: { _synced: true } });
  const banks = await Bank.aggregate(pipelines).exec();
  return { success: true, banks };
};

exports.sync_banks = async (banks, author) => {
  const toCreate = banks.filter(e => e.action === "create");
  const toUpdate = banks.filter(e => e.action === "update");
  const toDelete = banks.filter(e => e.action === "delete");

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (toCreate.length > 0) {
      const newBanks = await Bank.insertMany(
        toCreate.map(bank => ({
          code: bank.code.toUpperCase(),
          description: bank.description,
        })),
        { session }
      );

      if (newBanks.length !== toCreate.length) {
        throw new CustomError("Failed to sync banks. Please try again.", 500);
      }

      const ids = newBanks.map(bank => bank._id);
      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `created a bank`,
        resource: `bank`,
        session,
      });
    }

    if (toUpdate.length > 0) {
      const setters = toUpdate.map(e => ({
        updateOne: {
          filter: { _id: e._id },
          update: { $set: { code: e.code.toUpperCase(), description: e.description } },
        },
      }));

      const updates = await Bank.bulkWrite(setters, { session });

      if (updates.modifiedCount + updates.upsertedCount !== toUpdate.length) {
        throw new CustomError("Failed to sync banks. Please try again.", 500);
      }

      const ids = toUpdate.map(e => e._id);
      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `updated a bank`,
        resource: `bank`,
        session,
      });
    }

    if (toDelete.length > 0) {
      const ids = toDelete.map(e => e._id);
      const deleted = await Bank.updateMany({ _id: { $in: ids } }, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();

      if (deleted.matchedCount !== ids.length) {
        throw new CustomError("Failed to sync banks. Please try again", 500);
      }

      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `deleted a bank`,
        resource: `bank`,
        session,
      });
    }

    await session.commitTransaction();

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to sync banks", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.download_business_types = async () => {
  const pipelines = [];
  pipelines.push({ $match: { deletedAt: null } });
  pipelines.push({ $addFields: { _synced: true } });
  const businessTypes = await BusinessType.aggregate(pipelines).exec();
  return { success: true, businessTypes };
};

exports.sync_business_types = async (businessTypes, author) => {
  const toCreate = businessTypes.filter(e => e.action === "create");
  const toUpdate = businessTypes.filter(e => e.action === "update");
  const toDelete = businessTypes.filter(e => e.action === "delete");

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (toCreate.length > 0) {
      const newBusinessTypes = await BusinessType.insertMany(
        toCreate.map(businessType => ({
          type: businessType.type,
        })),
        { session }
      );

      if (newBusinessTypes.length !== toCreate.length) {
        throw new CustomError("Failed to sync business types. Please try again.", 500);
      }

      const ids = newBusinessTypes.map(businessType => businessType._id);
      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `created a business type`,
        resource: `business type`,
        session,
      });
    }

    if (toUpdate.length > 0) {
      const setters = toUpdate.map(e => ({
        updateOne: {
          filter: { _id: e._id },
          update: { $set: { type: e.type } },
        },
      }));

      const updates = await BusinessType.bulkWrite(setters, { session });

      if (updates.modifiedCount + updates.upsertedCount !== toUpdate.length) {
        throw new CustomError("Failed to sync business types. Please try again.", 500);
      }

      const ids = toUpdate.map(e => e._id);
      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `updated a business type`,
        resource: `business type`,
        session,
      });
    }

    if (toDelete.length > 0) {
      const ids = toDelete.map(e => e._id);
      const deleted = await BusinessType.updateMany({ _id: { $in: ids } }, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();

      if (deleted.matchedCount !== ids.length) {
        throw new CustomError("Failed to sync business types. Please try again", 500);
      }

      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `deleted a business type`,
        resource: `business type`,
        session,
      });
    }

    await session.commitTransaction();

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to sync business types", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.download_centers = async () => {
  const pipelines = [];
  pipelines.push({ $match: { deletedAt: null } });
  pipelines.push({ $addFields: { _synced: true } });
  const centers = await Center.aggregate(pipelines).exec();
  return { success: true, centers };
};

exports.sync_centers = async (centers, author) => {
  const toCreate = centers.filter(e => e.action === "create");
  const toUpdate = centers.filter(e => e.action === "update");
  const toDelete = centers.filter(e => e.action === "delete");

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (toCreate.length > 0) {
      const newCenters = await Center.insertMany(
        toCreate.map(center => ({
          centerNo: center.centerNo.toUpperCase(),
          description: center.description,
          centerChief: center.centerChief,
          acctOfficer: center.acctOfficer,
          treasurer: center.treasurer,
          location: center.location,
        })),
        { session }
      );

      if (newCenters.length !== toCreate.length) {
        throw new CustomError("Failed to sync centers. Please try again.", 500);
      }

      const ids = newCenters.map(center => center._id);
      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `created a center`,
        resource: `center`,
        session,
      });
    }

    if (toUpdate.length > 0) {
      const setters = toUpdate.map(center => ({
        updateOne: {
          filter: { _id: center._id },
          update: {
            $set: {
              centerNo: center.centerNo.toUpperCase(),
              description: center.description,
              centerChief: center.centerChief,
              acctOfficer: center.acctOfficer,
              treasurer: center.treasurer,
              location: center.location,
            },
          },
        },
      }));

      const updates = await Center.bulkWrite(setters, { session });

      if (updates.modifiedCount + updates.upsertedCount !== toUpdate.length) {
        throw new CustomError("Failed to sync center. Please try again.", 500);
      }

      const ids = toUpdate.map(e => e._id);
      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `updated a center`,
        resource: `center`,
        session,
      });
    }

    if (toDelete.length > 0) {
      const ids = toDelete.map(e => e._id);
      const deleted = await Center.updateMany({ _id: { $in: ids } }, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();

      if (deleted.matchedCount !== ids.length) {
        throw new CustomError("Failed to sync centers. Please try again", 500);
      }

      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `deleted a center`,
        resource: `center`,
        session,
      });
    }

    await session.commitTransaction();

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to sync centers", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.download_chart_of_accounts = async () => {
  const pipelines = [];
  pipelines.push({ $match: { deletedAt: null } });
  pipelines.push({ $addFields: { _synced: true } });
  pipelines.push({
    $lookup: {
      from: "groupaccounts",
      localField: "groupOfAccount",
      foreignField: "_id",
      as: "groupOfAccount",
    },
  });
  pipelines.push({ $addFields: { groupOfAccount: { $arrayElemAt: ["$groupOfAccount", 0] } } });
  const chartOfAccounts = await ChartOfAccount.aggregate(pipelines).exec();
  return { success: true, chartOfAccounts };
};

exports.sync_chart_of_accounts = async (chartAccounts, author) => {
  const toUpdate = chartAccounts.filter(e => e.action === "update");

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (toUpdate.length > 0) {
      const setters = toUpdate.map(e => ({
        updateOne: {
          filter: { _id: e._id },
          update: { $set: { groupOfAccount: e.groupOfAccount._id } },
        },
      }));

      const updates = await ChartOfAccount.bulkWrite(setters, { session });

      if (updates.modifiedCount + updates.upsertedCount !== toUpdate.length) {
        throw new CustomError("Failed to sync chart of accounts. Please try again.", 500);
      }

      const ids = toUpdate.map(e => e._id);
      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `linked a chart of account`,
        resource: `chart of account`,
        session,
      });
    }

    await session.commitTransaction();

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to sync chart of accounts", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.download_clients = async () => {
  const pipelines = [];
  pipelines.push({ $match: { deletedAt: null } });
  pipelines.push({ $addFields: { _synced: true } });
  pipelines.push({ $lookup: { from: "centers", foreignField: "_id", localField: "center", as: "center" } });
  pipelines.push({ $lookup: { from: "businesstypes", foreignField: "_id", localField: "business", as: "business" } });
  pipelines.push({
    $addFields: {
      center: { $arrayElemAt: ["$center", 0] },
      business: { $arrayElemAt: ["$business", 0] },
    },
  });
  pipelines.push({
    $addFields: {
      center: "$center._id",
      centerLabel: "$center.centerNo",
      business: "$business._id",
      businessLabel: "$business.type",
      memberStatusLabel: "$memberStatus",
      birthdate: { $ifNull: [{ $dateToString: { format: "%Y-%m-%d", date: "$birthdate", timezone: "UTC" } }, null] },
      dateRelease: { $ifNull: [{ $dateToString: { format: "%Y-%m-%d", date: "$dateRelease", timezone: "UTC" } }, null] },
    },
  });
  const clients = await Customer.aggregate(pipelines).exec();
  return { success: true, clients };
};

exports.sync_clients = async (clients, files, author) => {
  const toCreate = clients.filter(e => e.action === "create");
  const toUpdate = clients.filter(e => e.action === "update");
  const toDelete = clients.filter(e => e.action === "delete");

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (toCreate.length > 0) await createClientsHelper(toCreate, files, author, session);
    if (toUpdate.length > 0) await updateClientsHelper(toUpdate, files, author, session);
    if (toDelete.length > 0) await deleteClientsHelper(toDelete, files, author, session);

    await session.commitTransaction();

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    console.log(error);
    throw new CustomError(error.message || "Failed to sync clients", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.download_loan_products = async () => {
  const pipelines = [];
  pipelines.push({ $match: { deletedAt: null } });
  pipelines.push({ $addFields: { _synced: true } });
  pipelines.push({
    $lookup: {
      from: "loancodes",
      let: { loanCodesIds: "$loanCodes" },
      pipeline: [
        { $match: { $expr: { $in: ["$_id", "$$loanCodesIds"] }, deletedAt: null } },
        { $addFields: { _synced: true } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode" } },
        { $addFields: { acctCode: { $arrayElemAt: ["$acctCode", 0] } } },
      ],
      as: "loanCodes",
    },
  });
  const loanProducts = await Loan.aggregate(pipelines).exec();
  return { success: true, loanProducts };
};

exports.sync_loan_products = async (products, author) => {
  const toCreate = products.filter(e => e.action === "create");
  const toUpdate = products.filter(e => e.action === "update");
  const toDelete = products.filter(e => e.action === "delete");

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (toCreate.length > 0) {
      const results = await Promise.all(
        toCreate.map(async loan => {
          const newProductLoan = await new Loan({
            code: loan.code.toUpperCase(),
            description: loan.description,
          }).save();
          if (!newProductLoan) throw new CustomError("Failed to create product loan");

          const codes = loan.loanCodes.map(code => ({
            loan: newProductLoan._id,
            module: code.module,
            loanType: code.loanType,
            acctCode: code.acctCode,
            sortOrder: code.sortOrder,
          }));

          const newLoanCodes = await LoanCode.insertMany(codes, { lean: true });
          const ids = newLoanCodes.map(code => code._id);

          const productLoan = await Loan.findByIdAndUpdate(newProductLoan._id, { $set: { loanCodes: ids } }, { new: true })
            .populate({ path: "loanCodes", select: "-createdAt", match: { deletedAt: null }, populate: { path: "acctCode", select: "-createdAt", match: { deletedAt: null } } })
            .exec();

          return productLoan;
        })
      );

      const ids = results.map(product => product._id);
      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `created a loan product`,
        resource: `loan product`,
        session,
      });
    }

    if (toUpdate.length > 0) {
      const setters = await Promise.all(
        toUpdate.map(async loan => {
          const idsToPush = [];
          const idsToPull = [];

          const codesToCreate = loan.loanCodes.filter(e => e.action === "create");
          const codesToUpdate = loan.loanCodes.filter(e => e.action === "update");
          const codesToDelete = loan.loanCodes.filter(e => e.action === "delete");

          if (codesToCreate.length > 0) {
            const codes = codesToCreate.map(code => ({
              loan: loan._id,
              module: code.module,
              loanType: code.loanType,
              acctCode: code.acctCode,
              sortOrder: code.sortOrder,
            }));

            const newLoanCodes = await LoanCode.insertMany(codes, { lean: true });
            idsToPush.push(newLoanCodes.map(code => code._id));
          }

          if (codesToUpdate.length > 0) {
            const codeSetters = codesToUpdate.map(e => {
              return {
                updateOne: {
                  filter: { _id: e._id },
                  update: {
                    $set: {
                      loan: e.loan,
                      module: e.module,
                      loanType: e.loanType,
                      acctCode: e.acctCode._id,
                      sortOrder: e.sortOrder,
                    },
                  },
                },
              };
            });

            const updatedCodes = await LoanCode.bulkWrite(codeSetters, { session });

            if (updatedCodes.matchedCount !== codesToUpdate.length) {
              throw new CustomError("Failed to sync loan products. Please try again.", 500);
            }
          }

          if (codesToDelete.length > 0) {
            const ids = codesToDelete.map(code => code._id);
            await LoanCode.updateMany({ _id: { $in: ids } }, { $set: { deletedAt: new Date().toISOString() } }).exec();
            idsToPull.push(ids);
          }

          return {
            updateOne: {
              filter: { _id: loan._id },
              update: {
                $set: {
                  code: loan.code.toUpperCase(),
                  description: loan.description,
                },
              },
            },
          };
        })
      );

      const updates = await Loan.bulkWrite(setters, { session });

      if (updates.modifiedCount + updates.upsertedCount !== toUpdate.length) {
        throw new CustomError("Failed to sync loan products. Please try again.", 500);
      }

      const ids = toUpdate.map(e => e._id);
      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `updated a loan product`,
        resource: `loan product`,
        session,
      });
    }

    if (toDelete.length > 0) {
      const ids = toDelete.map(e => e._id);
      const loanCodeIds = toDelete.flatMap(e => e.loanCodes.flatMap(f => f._id));
      const deleted = await Loan.updateMany({ _id: { $in: ids } }, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();
      await LoanCode.updateMany({ _id: { $in: loanCodeIds } }, { $set: { deletedAt: new Date().toISOString() } }).exec();

      if (deleted.matchedCount !== ids.length) {
        throw new CustomError("Failed to sync loan products. Please try again", 500);
      }

      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `deleted a loan product along with its linked loan codes`,
        resource: `product`,
        session,
      });
    }

    await session.commitTransaction();

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to sync loan products", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.download_loan_codes = async () => {
  const pipelines = [];
  pipelines.push({ $match: { deletedAt: null } });
  pipelines.push({ $addFields: { _synced: true } });
  const loanCodes = await LoanCode.aggregate(pipelines).exec();
  return { success: true, loanCodes };
};

exports.download_natures = async () => {
  const pipelines = [];
  pipelines.push({ $match: { deletedAt: null } });
  pipelines.push({ $addFields: { _synced: true } });
  const natures = await Nature.aggregate(pipelines).exec();
  return { success: true, natures };
};

exports.sync_natures = async (natures, author) => {
  const toCreate = natures.filter(e => e.action === "create");
  const toUpdate = natures.filter(e => e.action === "update");
  const toDelete = natures.filter(e => e.action === "delete");

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (toCreate.length > 0) {
      const newNatures = await Nature.insertMany(
        toCreate.map(nature => ({
          nature: nature.nature,
          description: nature.description,
        })),
        { session }
      );

      if (newNatures.length !== toCreate.length) {
        throw new CustomError("Failed to sync natures. Please try again.", 500);
      }

      const ids = newNatures.map(nature => nature._id);
      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `created a nature`,
        resource: `nature`,
        session,
      });
    }

    if (toUpdate.length > 0) {
      const setters = toUpdate.map(e => ({
        updateOne: {
          filter: { _id: e._id },
          update: { $set: { nature: e.nature, description: e.description } },
        },
      }));

      const updates = await Nature.bulkWrite(setters, { session });

      if (updates.modifiedCount + updates.upsertedCount !== toUpdate.length) {
        throw new CustomError("Failed to sync natures. Please try again.", 500);
      }

      const ids = toUpdate.map(e => e._id);
      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `updated a nature`,
        resource: `nature`,
        session,
      });
    }

    if (toDelete.length > 0) {
      const ids = toDelete.map(e => e._id);
      const deleted = await Nature.updateMany({ _id: { $in: ids } }, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();

      if (deleted.matchedCount !== ids.length) {
        throw new CustomError("Failed to sync natures. Please try again", 500);
      }

      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `deleted a nature`,
        resource: `nature`,
        session,
      });
    }

    await session.commitTransaction();

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to sync natures", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.download_payment_schedules = async () => {
  const pipelines = [];
  pipelines.push({ $match: { deletedAt: null } });
  pipelines.push({ $addFields: { _synced: true } });
  const paymentSchedules = await PaymentSchedule.aggregate(pipelines).exec();
  return { success: true, paymentSchedules };
};

exports.download_suppliers = async () => {
  const pipelines = [];
  pipelines.push({ $match: { deletedAt: null } });
  pipelines.push({ $addFields: { _synced: true } });
  const suppliers = await Supplier.aggregate(pipelines).exec();
  return { success: true, suppliers };
};

exports.sync_suppliers = async (suppliers, author) => {
  const toCreate = suppliers.filter(e => e.action === "create");
  const toUpdate = suppliers.filter(e => e.action === "update");
  const toDelete = suppliers.filter(e => e.action === "delete");

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (toCreate.length > 0) {
      const newSuppliers = await Supplier.insertMany(
        toCreate.map(supplier => ({
          code: supplier.code.toUpperCase(),
          description: supplier.description,
        })),
        { session }
      );

      if (newSuppliers.length !== toCreate.length) {
        throw new CustomError("Failed to sync business suppliers. Please try again.", 500);
      }

      const ids = newSuppliers.map(supplier => supplier._id);
      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `created a business supplier`,
        resource: `business supplier`,
        session,
      });
    }

    if (toUpdate.length > 0) {
      const setters = toUpdate.map(e => ({
        updateOne: {
          filter: { _id: e._id },
          update: { $set: { code: e.code.toUpperCase(), description: e.description } },
        },
      }));

      const updates = await Supplier.bulkWrite(setters, { session });

      if (updates.modifiedCount + updates.upsertedCount !== toUpdate.length) {
        throw new CustomError("Failed to sync business suppliers. Please try again.", 500);
      }

      const ids = toUpdate.map(e => e._id);
      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `updated a business supplier`,
        resource: `business supplier`,
        session,
      });
    }

    if (toDelete.length > 0) {
      const ids = toDelete.map(e => e._id);
      const deleted = await Supplier.updateMany({ _id: { $in: ids } }, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();

      if (deleted.matchedCount !== ids.length) {
        throw new CustomError("Failed to sync business suppliers. Please try again", 500);
      }

      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `deleted a business supplier`,
        resource: `business supplier`,
        session,
      });
    }

    await session.commitTransaction();

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to sync business suppliers", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.download_system_params = async () => {
  const pipelines = [];
  pipelines.push({ $match: { deletedAt: null } });
  pipelines.push({ $addFields: { _synced: true } });
  const loanReleaseEntryParams = await LoanReleaseEntryParam.aggregate(pipelines).exec();
  const signatureParams = await SignatureParam.aggregate(pipelines).exec();
  return { success: true, loanReleaseEntryParams, signatureParams };
};

exports.sync_system_params = async (suppliers, author) => {
  const toUpdate = suppliers.filter(e => e.action === "update");

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (toUpdate.length > 0) {
      const setters = toUpdate.map(e => ({
        updateOne: {
          filter: { _id: e._id },
          update: {
            $set: {
              approvedBy: e.approvedBy,
              checkedBy: e.approvedBy,
            },
          },
        },
      }));

      const updates = await SignatureParam.bulkWrite(setters, { session });

      if (updates.modifiedCount + updates.upsertedCount !== toUpdate.length) {
        throw new CustomError("Failed to sync business suppliers. Please try again.", 500);
      }

      const ids = toUpdate.map(e => e._id);
      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `updated a signatures`,
        resource: `system parameters`,
        session,
      });
    }

    await session.commitTransaction();

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to sync system parameters", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.download_weekly_savings = async () => {
  const pipelines = [];
  pipelines.push({ $match: { deletedAt: null } });
  pipelines.push({ $addFields: { _synced: true } });
  const weeklySavings = await WeeklySaving.aggregate(pipelines).exec();
  return { success: true, weeklySavings };
};

exports.sync_weekly_savings = async (weeklySavings, author) => {
  const toUpdate = weeklySavings.filter(e => e.action === "update");
  const toDelete = weeklySavings.filter(e => e.action === "delete");

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (toUpdate.length > 0) {
      const setters = toUpdate.map(e => ({
        updateOne: {
          filter: { _id: e._id },
          update: {
            $set: {
              rangeAmountFrom: e.rangeAmountFrom,
              rangeAmountTo: e.rangeAmountTo,
              weeklySavingsFund: e.weeklySavingsFund,
            },
          },
        },
      }));

      const updates = await WeeklySaving.bulkWrite(setters, { session });

      if (updates.modifiedCount + updates.upsertedCount !== toUpdate.length) {
        throw new CustomError("Failed to sync weekly savings. Please try again.", 500);
      }

      const ids = toUpdate.map(e => e._id);
      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `updated a weekly savings`,
        resource: `weekly savings`,
        session,
      });
    }

    if (toDelete.length > 0) {
      const ids = toDelete.map(e => e._id);
      const deleted = await WeeklySaving.updateMany({ _id: { $in: ids } }, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();

      if (deleted.matchedCount !== ids.length) {
        throw new CustomError("Failed to sync weekly savings. Please try again", 500);
      }

      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `deleted a weekly savings`,
        resource: `weekly savings`,
        session,
      });
    }

    await session.commitTransaction();

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to sync weekly savings", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.download_group_of_accounts = async () => {
  const pipelines = [];
  pipelines.push({ $match: { deletedAt: null } });
  pipelines.push({ $addFields: { _synced: true } });
  const groupAccounts = await GroupAccount.aggregate(pipelines).exec();
  return { success: true, groupAccounts };
};

exports.sync_group_of_accounts = async (groupAccounts, author) => {
  const toCreate = groupAccounts.filter(e => e.action === "create");
  const toUpdate = groupAccounts.filter(e => e.action === "update");
  const toDelete = groupAccounts.filter(e => e.action === "delete");

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (toCreate.length > 0) {
      const newGroupAccounts = await GroupAccount.insertMany(
        toCreate.map(groupAccount => ({
          code: groupAccount.code.toUpperCase(),
        })),
        { session }
      );

      if (newGroupAccounts.length !== toCreate.length) {
        throw new CustomError("Failed to sync group of accounts. Please try again.", 500);
      }

      const ids = newGroupAccounts.map(groupAccount => groupAccount._id);
      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `created a group of account`,
        resource: `group of account`,
        session,
      });
    }

    if (toUpdate.length > 0) {
      const setters = toUpdate.map(e => ({
        updateOne: {
          filter: { _id: e._id },
          update: { $set: { code: e.code.toUpperCase() } },
        },
      }));

      const updates = await GroupAccount.bulkWrite(setters, { session });

      if (updates.modifiedCount + updates.upsertedCount !== toUpdate.length) {
        throw new CustomError("Failed to sync group of accounts. Please try again.", 500);
      }

      const ids = toUpdate.map(e => e._id);
      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `updated a group of account`,
        resource: `group of account`,
        session,
      });
    }

    if (toDelete.length > 0) {
      const ids = toDelete.map(e => e._id);
      const deleted = await GroupAccount.updateMany({ _id: { $in: ids } }, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();

      if (deleted.matchedCount !== ids.length) {
        throw new CustomError("Failed to sync group of accounts. Please try again", 500);
      }

      await activityLogServ.bulk_create({
        ids,
        author: author._id,
        username: author.username,
        activity: `deleted a group of account`,
        resource: `group of account`,
        session,
      });
    }

    await session.commitTransaction();

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to sync banks", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

// Sync Transactions

exports.download_loan_release_with_entries = async (dateFrom, dateTo) => {
  let fromDate = new Date(dateFrom);
  fromDate.setHours(0, 0, 0, 0);

  let toDate = new Date(dateTo);
  toDate.setHours(23, 59, 59, 999);

  const filter = { deletedAt: null, $and: [{ date: { $gte: fromDate } }, { date: { $lte: new Date(toDate) } }] };

  const pipelines = [];
  pipelines.push({ $match: filter });
  pipelines.push({ $addFields: { _synced: true } });
  pipelines.push({ $lookup: { from: "centers", localField: "center", foreignField: "_id", as: "center" } });
  pipelines.push({ $lookup: { from: "banks", localField: "bank", foreignField: "_id", as: "bank" } });
  pipelines.push({ $lookup: { from: "loans", localField: "loan", foreignField: "_id", as: "loan" } });
  pipelines.push({ $addFields: { center: { $arrayElemAt: ["$center", 0] }, loan: { $arrayElemAt: ["$loan", 0] }, bank: { $arrayElemAt: ["$bank", 0] } } });
  pipelines.push({
    $lookup: {
      from: "entries",
      let: { transactionId: "$_id" },
      pipeline: [
        { $match: { $and: [{ $expr: { $eq: ["$transaction", "$$transactionId"] } }, { $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] }] } },
        { $lookup: { from: "customers", localField: "client", foreignField: "_id", as: "client" } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode" } },
        {
          $addFields: {
            client: { $arrayElemAt: ["$client", 0] },
            acctCode: { $arrayElemAt: ["$acctCode", 0] },
            action: "retain",
            _synced: false,
          },
        },
        { $sort: { line: 1 } },
      ],
      as: "entries",
    },
  });

  const loanReleases = await Transaction.aggregate(pipelines).exec();

  const loanReleaseIds = loanReleases.map(loanRelease => loanRelease._id);
  const dueDates = await PaymentSchedule.find({ loanRelease: { $in: loanReleaseIds } })
    .lean()
    .exec();

  return { success: true, loanReleases, dueDates };
};

exports.sync_loan_release_with_entries = async (loanReleases, author) => {
  const toCreate = loanReleases.filter(e => e.action === "create");
  const toUpdate = loanReleases.filter(e => e.action === "update");
  const toDelete = loanReleases.filter(e => e.action === "delete");

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (toCreate.length > 0) await createLoanReleasesHelper(toCreate, author, session);
    if (toUpdate.length > 0) await updateLoanReleasesHelper(toUpdate, author, session);
    if (toDelete.length > 0) await deleteLoanReleasesHelper(toDelete, author, session);

    await session.commitTransaction();

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to sync loan releases", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.download_journal_voucher_with_entries = async (dateFrom, dateTo) => {
  let fromDate = new Date(dateFrom);
  fromDate.setHours(0, 0, 0, 0);

  let toDate = new Date(dateTo);
  toDate.setHours(23, 59, 59, 999);

  const filter = { deletedAt: null, $and: [{ date: { $gte: fromDate } }, { date: { $lte: new Date(toDate) } }] };

  const pipelines = [];
  pipelines.push({ $match: filter });
  pipelines.push({ $addFields: { _synced: true } });
  pipelines.push({ $lookup: { from: "banks", localField: "bankCode", foreignField: "_id", as: "bankCode" } });
  pipelines.push({ $addFields: { bankCode: { $arrayElemAt: ["$bankCode", 0] } } });
  pipelines.push({
    $project: {
      bank: "$bankCode._id",
      bankLabel: "$bankCode.code",
      acctMonth: 1,
      acctYear: 1,
      amount: 1,
      date: { $ifNull: [{ $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "UTC" } }, null] },
      checkDate: { $ifNull: [{ $dateToString: { format: "%Y-%m-%d", date: "$checkDate", timezone: "UTC" } }, null] },
      checkNo: 1,
      code: 1,
      encodedBy: 1,
      nature: 1,
      remarks: 1,
      createdBy: 1,
      updatedBy: 1,
      _synced: 1,
    },
  });
  pipelines.push({
    $lookup: {
      from: "journalvoucherentries",
      let: { journalVoucherId: "$_id" },
      pipeline: [
        { $match: { $and: [{ $expr: { $eq: ["$journalVoucher", "$$journalVoucherId"] } }, { $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] }] } },
        { $lookup: { from: "customers", localField: "client", foreignField: "_id", as: "client" } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode" } },
        {
          $addFields: {
            client: { $arrayElemAt: ["$client", 0] },
            acctCode: { $arrayElemAt: ["$acctCode", 0] },
            action: "retain",
            _synced: false,
          },
        },
        { $sort: { line: 1 } },
        {
          $project: {
            line: 1,
            client: { $ifNull: ["$client._id", null] },
            clientLabel: { $ifNull: ["$client.name", null] },
            particular: 1,
            acctCodeId: "$acctCode._id",
            acctCode: "$acctCode.code",
            description: 1,
            debit: 1,
            credit: 1,
            cvForRecompute: 1,
            _synced: 1,
            action: 1,
          },
        },
      ],
      as: "entries",
    },
  });

  const journalVouchers = await JournalVoucher.aggregate(pipelines).exec();

  return { success: true, journalVouchers };
};

exports.sync_journal_voucher_with_entries = async (journalVouchers, author) => {
  const toCreate = journalVouchers.filter(e => e.action === "create");
  const toUpdate = journalVouchers.filter(e => e.action === "update");
  const toDelete = journalVouchers.filter(e => e.action === "delete");

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (toCreate.length > 0) await createJournalVoucherHelper(toCreate, author, session);
    if (toUpdate.length > 0) await updateJournalVoucherHelper(toUpdate, author, session);
    if (toDelete.length > 0) await deleteJournalVoucherHelper(toDelete, author, session);

    await session.commitTransaction();

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to sync journal vouchers", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.download_expense_voucher_with_entries = async (dateFrom, dateTo) => {
  let fromDate = new Date(dateFrom);
  fromDate.setHours(0, 0, 0, 0);

  let toDate = new Date(dateTo);
  toDate.setHours(23, 59, 59, 999);

  const filter = { deletedAt: null, $and: [{ date: { $gte: fromDate } }, { date: { $lte: new Date(toDate) } }] };

  const pipelines = [];
  pipelines.push({ $match: filter });
  pipelines.push({ $addFields: { _synced: true } });
  pipelines.push({ $lookup: { from: "banks", localField: "bankCode", foreignField: "_id", as: "bankCode" } });
  pipelines.push({ $addFields: { bankCode: { $arrayElemAt: ["$bankCode", 0] } } });
  pipelines.push({
    $project: {
      code: 1,
      supplier: 1,
      refNo: 1,
      remarks: 1,
      date: { $ifNull: [{ $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "UTC" } }, null] },
      checkDate: { $ifNull: [{ $dateToString: { format: "%Y-%m-%d", date: "$checkDate", timezone: "UTC" } }, null] },
      acctMonth: 1,
      acctYear: 1,
      checkNo: 1,
      bank: "$bankCode._id",
      bankLabel: "$bankCode.code",
      amount: 1,
      createdAt: 1,
      deletedAt: 1,
      _synced: 1,
    },
  });
  pipelines.push({
    $lookup: {
      from: "expensevoucherentries",
      let: { expenseVoucherId: "$_id" },
      pipeline: [
        { $match: { $and: [{ $expr: { $eq: ["$expenseVoucher", "$$expenseVoucherId"] } }, { $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] }] } },
        { $lookup: { from: "customers", localField: "client", foreignField: "_id", as: "client" } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode" } },
        {
          $addFields: {
            client: { $arrayElemAt: ["$client", 0] },
            acctCode: { $arrayElemAt: ["$acctCode", 0] },
            action: "retain",
            _synced: false,
          },
        },
        { $sort: { line: 1 } },
        {
          $project: {
            line: 1,
            client: { $ifNull: ["$client._id", null] },
            clientLabel: { $ifNull: ["$client.name", null] },
            particular: 1,
            acctCodeId: "$acctCode._id",
            acctCode: "$acctCode.code",
            description: 1,
            debit: 1,
            credit: 1,
            cvForRecompute: 1,
            _synced: 1,
            action: 1,
          },
        },
      ],
      as: "entries",
    },
  });

  const expenseVouchers = await ExpenseVoucher.aggregate(pipelines).exec();

  return { success: true, expenseVouchers };
};

exports.sync_expense_voucher_with_entries = async (expenseVouchers, author) => {
  const toCreate = expenseVouchers.filter(e => e.action === "create");
  const toUpdate = expenseVouchers.filter(e => e.action === "update");
  const toDelete = expenseVouchers.filter(e => e.action === "delete");

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (toCreate.length > 0) await createExpenseVoucherHelper(toCreate, author, session);
    if (toUpdate.length > 0) await updateExpenseVoucherHelper(toUpdate, author, session);
    if (toDelete.length > 0) await deleteExpenseVoucherHelper(toDelete, author, session);

    await session.commitTransaction();

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to sync expense vouchers", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.download_official_receipt_with_entries = async (dateFrom, dateTo) => {
  let fromDate = new Date(dateFrom);
  fromDate.setHours(0, 0, 0, 0);

  let toDate = new Date(dateTo);
  toDate.setHours(23, 59, 59, 999);

  const filter = { deletedAt: null, $and: [{ date: { $gte: fromDate } }, { date: { $lte: new Date(toDate) } }] };

  const pipelines = [];
  pipelines.push({ $match: filter });
  pipelines.push({ $addFields: { _synced: true } });
  pipelines.push({ $lookup: { from: "banks", localField: "bankCode", foreignField: "_id", as: "bankCode" } });
  pipelines.push({ $lookup: { from: "centers", localField: "center", foreignField: "_id", as: "center" } });
  pipelines.push({
    $addFields: {
      bankCode: { $arrayElemAt: ["$bankCode", 0] },
      center: { $arrayElemAt: ["$center", 0] },
    },
  });
  pipelines.push({
    $project: {
      code: 1,
      center: "$center._id",
      centerLabel: "$center.centerNo",
      centerName: "$center.centerNo $center.description",
      remarks: 1,
      date: { $ifNull: [{ $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "UTC" } }, null] },
      checkDate: { $ifNull: [{ $dateToString: { format: "%Y-%m-%d", date: "$checkDate", timezone: "UTC" } }, null] },
      acctMonth: 1,
      acctYear: 1,
      acctOfficer: 1,
      checkNo: 1,
      bankCode: "$bankCode._id",
      bankCodeLabel: "$bankCode.code",
      type: 1,
      amount: 1,
      cashCollection: 1,
      _synced: 1,
    },
  });
  pipelines.push({
    $lookup: {
      from: "acknowledgemententries",
      let: { acknowledgementId: "$_id" },
      pipeline: [
        { $match: { $and: [{ $expr: { $eq: ["$acknowledgement", "$$acknowledgementId"] } }, { $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] }] } },
        { $lookup: { from: "customers", localField: "client", foreignField: "_id", as: "client" } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode" } },
        { $lookup: { from: "transactions", localField: "loanReleaseId", foreignField: "_id", as: "loanReleaseId" } },
        {
          $addFields: {
            loanReleaseId: { $arrayElemAt: ["$loanReleaseId", 0] },
            client: { $arrayElemAt: ["$client", 0] },
            acctCode: { $arrayElemAt: ["$acctCode", 0] },
            action: "retain",
            _synced: false,
          },
        },
        { $sort: { line: 1 } },
        {
          $project: {
            line: 1,
            clientId: { $ifNull: ["$client._id", null] },
            clientName: { $ifNull: ["$client.name", null] },
            loanReleaseId: "$loanReleaseId._id",
            cvNo: "$loanReleaseId.code",
            dueDate: 1,
            week: 1,
            acctCodeId: "$acctCode._id",
            acctCode: "$acctCode.code",
            acctCodeDesc: "$acctCode.description",
            debit: 1,
            credit: 1,
            _synced: 1,
            action: 1,
          },
        },
      ],
      as: "entries",
    },
  });

  const officialReceipts = await Acknowledgement.aggregate(pipelines).exec();

  return { success: true, officialReceipts };
};

exports.sync_official_receipt_with_entries = async (officialReceipts, author) => {
  const toCreate = officialReceipts.filter(e => e.action === "create");
  const toUpdate = officialReceipts.filter(e => e.action === "update");
  const toDelete = officialReceipts.filter(e => e.action === "delete");

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (toCreate.length > 0) await createOfficialReceiptHelper(toCreate, author, session);
    if (toUpdate.length > 0) await updateOfficialReceiptHelper(toUpdate, author, session);
    if (toDelete.length > 0) await deleteOfficialReceiptHelper(toDelete, author, session);

    await session.commitTransaction();

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to sync official receipts", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.download_acknowledgement_receipt_with_entries = async (dateFrom, dateTo) => {
  let fromDate = new Date(dateFrom);
  fromDate.setHours(0, 0, 0, 0);

  let toDate = new Date(dateTo);
  toDate.setHours(23, 59, 59, 999);

  const filter = { deletedAt: null, $and: [{ date: { $gte: fromDate } }, { date: { $lte: new Date(toDate) } }] };

  const pipelines = [];
  pipelines.push({ $match: filter });
  pipelines.push({ $addFields: { _synced: true } });
  pipelines.push({ $lookup: { from: "banks", localField: "bankCode", foreignField: "_id", as: "bankCode" } });
  pipelines.push({ $lookup: { from: "centers", localField: "center", foreignField: "_id", as: "center" } });
  pipelines.push({
    $addFields: {
      bankCode: { $arrayElemAt: ["$bankCode", 0] },
      center: { $arrayElemAt: ["$center", 0] },
    },
  });
  pipelines.push({
    $project: {
      code: 1,
      center: "$center._id",
      centerLabel: "$center.centerNo",
      centerName: "$center.centerNo $center.description",
      remarks: 1,
      date: { $ifNull: [{ $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "UTC" } }, null] },
      checkDate: { $ifNull: [{ $dateToString: { format: "%Y-%m-%d", date: "$checkDate", timezone: "UTC" } }, null] },
      acctMonth: 1,
      acctYear: 1,
      acctOfficer: 1,
      checkNo: 1,
      bankCode: "$bankCode._id",
      bankCodeLabel: "$bankCode.code",
      type: 1,
      amount: 1,
      cashCollection: 1,
      _synced: 1,
    },
  });
  pipelines.push({
    $lookup: {
      from: "releaseentries",
      let: { releaseId: "$_id" },
      pipeline: [
        { $match: { $and: [{ $expr: { $eq: ["$release", "$$releaseId"] } }, { $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] }] } },
        { $lookup: { from: "customers", localField: "client", foreignField: "_id", as: "client" } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode" } },
        { $lookup: { from: "transactions", localField: "loanReleaseId", foreignField: "_id", as: "loanReleaseId" } },
        {
          $addFields: {
            loanReleaseId: { $arrayElemAt: ["$loanReleaseId", 0] },
            client: { $arrayElemAt: ["$client", 0] },
            acctCode: { $arrayElemAt: ["$acctCode", 0] },
            action: "retain",
            _synced: false,
          },
        },
        { $sort: { line: 1 } },
        {
          $project: {
            line: 1,
            clientId: { $ifNull: ["$client._id", null] },
            clientName: { $ifNull: ["$client.name", null] },
            loanReleaseId: "$loanReleaseId._id",
            cvNo: "$loanReleaseId.code",
            dueDate: 1,
            week: 1,
            acctCodeId: "$acctCode._id",
            acctCode: "$acctCode.code",
            acctCodeDesc: "$acctCode.description",
            debit: 1,
            credit: 1,
            _synced: 1,
            action: 1,
          },
        },
      ],
      as: "entries",
    },
  });

  const acknowledgementReceipts = await Release.aggregate(pipelines).exec();

  return { success: true, acknowledgementReceipts };
};

exports.sync_acknowledgement_receipt_with_entries = async (acknowledgementReceipts, author) => {
  const toCreate = acknowledgementReceipts.filter(e => e.action === "create");
  const toUpdate = acknowledgementReceipts.filter(e => e.action === "update");
  const toDelete = acknowledgementReceipts.filter(e => e.action === "delete");

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (toCreate.length > 0) await createAcknowledgemenetReceiptsHelper(toCreate, author, session);
    if (toUpdate.length > 0) await updateAcknowledgemenetReceiptsHelper(toUpdate, author, session);
    if (toDelete.length > 0) await deleteAcknowledgemenetReceiptsHelper(toDelete, author, session);

    await session.commitTransaction();

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to sync acknowledgement receipts", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.download_emergency_loan_with_entries = async (dateFrom, dateTo) => {
  let fromDate = new Date(dateFrom);
  fromDate.setHours(0, 0, 0, 0);

  let toDate = new Date(dateTo);
  toDate.setHours(23, 59, 59, 999);

  const pipelines = [];
  const filter = { deletedAt: null, $and: [{ date: { $gte: fromDate } }, { date: { $lte: new Date(toDate) } }] };
  pipelines.push({ $match: filter });
  pipelines.push({ $addFields: { _synced: true } });
  pipelines.push({ $lookup: { from: "banks", localField: "bankCode", foreignField: "_id", as: "bankCode" } });
  pipelines.push({ $lookup: { from: "customers", localField: "client", foreignField: "_id", as: "client" } });
  pipelines.push({ $addFields: { bankCode: { $arrayElemAt: ["$bankCode", 0] }, client: { $arrayElemAt: ["$client", 0] } } });
  pipelines.push({
    $project: {
      code: 1,
      clientLabel: "$client.name",
      clientValue: "$client._id",
      refNo: 1,
      remarks: 1,
      date: { $ifNull: [{ $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "UTC" } }, null] },
      checkDate: { $ifNull: [{ $dateToString: { format: "%Y-%m-%d", date: "$checkDate", timezone: "UTC" } }, null] },
      acctMonth: 1,
      acctYear: 1,
      checkNo: 1,
      bankCode: "$bankCode._id",
      bankCodeLabel: "$bankCode.code",
      amount: 1,
      _synced: 1,
    },
  });
  pipelines.push({
    $lookup: {
      from: "emergencyloanentries",
      let: { emergencyLoanId: "$_id" },
      pipeline: [
        { $match: { $and: [{ $expr: { $eq: ["$emergencyLoan", "$$emergencyLoanId"] } }, { $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] }] } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode" } },
        { $lookup: { from: "customers", localField: "client", foreignField: "_id", as: "client" } },
        {
          $addFields: {
            client: { $arrayElemAt: ["$client", 0] },
            acctCode: { $arrayElemAt: ["$acctCode", 0] },
            action: "retain",
            _synced: false,
          },
        },
        { $sort: { line: 1 } },
        {
          $project: {
            line: 1,
            client: { $ifNull: ["$client._id", null] },
            clientLabel: { $ifNull: ["$client.name", null] },
            acctCodeId: "$acctCode._id",
            acctCode: "$acctCode.code",
            description: "$acctCode.description",
            debit: 1,
            credit: 1,
            _synced: 1,
            action: 1,
          },
        },
      ],
      as: "entries",
    },
  });

  const emergencyLoans = await EmergencyLoan.aggregate(pipelines).exec();

  return { success: true, emergencyLoans };
};

exports.sync_emergency_loan_with_entries = async (emergencyLoans, author) => {
  const toCreate = emergencyLoans.filter(e => e.action === "create");
  const toUpdate = emergencyLoans.filter(e => e.action === "update");
  const toDelete = emergencyLoans.filter(e => e.action === "delete");

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (toCreate.length > 0) await createEmergencyLoansHelper(toCreate, author, session);
    if (toUpdate.length > 0) await updateEmergencyLoansHelper(toUpdate, author, session);
    if (toDelete.length > 0) await deleteEmergencyLoansHelper(toDelete, author, session);

    await session.commitTransaction();

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to sync acknowledgement receipts", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};

exports.download_damayan_fund_with_entries = async (dateFrom, dateTo) => {
  let fromDate = new Date(dateFrom);
  fromDate.setHours(0, 0, 0, 0);

  let toDate = new Date(dateTo);
  toDate.setHours(23, 59, 59, 999);

  const filter = { deletedAt: null, $and: [{ date: { $gte: fromDate } }, { date: { $lte: new Date(toDate) } }] };
  const pipelines = [];

  pipelines.push({ $match: filter });
  pipelines.push({ $addFields: { _synced: true } });
  pipelines.push({ $lookup: { from: "banks", localField: "bankCode", foreignField: "_id", as: "bankCode" } });
  pipelines.push({ $lookup: { from: "centers", localField: "center", foreignField: "_id", as: "center" } });
  pipelines.push({ $addFields: { bankCode: { $arrayElemAt: ["$bankCode", 0] }, center: { $arrayElemAt: ["$center", 0] } } });
  pipelines.push({
    $project: {
      code: 1,
      nature: 1,
      name: 1,
      centerLabel: { $concat: [{ $ifNull: ["$center.code", ""] }, " ", { $ifNull: ["$center.description", ""] }] },
      center: "$center._id",
      refNo: 1,
      remarks: 1,
      date: { $ifNull: [{ $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "UTC" } }, null] },
      checkDate: { $ifNull: [{ $dateToString: { format: "%Y-%m-%d", date: "$checkDate", timezone: "UTC" } }, null] },
      acctMonth: 1,
      acctYear: 1,
      checkNo: 1,
      bankCode: "$bankCode._id",
      bankCodeLabel: "$bankCode.code",
      amount: 1,
      _synced: 1,
    },
  });
  pipelines.push({
    $lookup: {
      from: "damayanfundentries",
      let: { damayanFundId: "$_id" },
      pipeline: [
        { $match: { $and: [{ $expr: { $eq: ["$damayanFund", "$$damayanFundId"] } }, { $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] }] } },
        { $lookup: { from: "chartofaccounts", localField: "acctCode", foreignField: "_id", as: "acctCode" } },
        { $lookup: { from: "customers", localField: "client", foreignField: "_id", as: "client" } },
        { $addFields: { acctCode: { $arrayElemAt: ["$acctCode", 0] }, client: { $arrayElemAt: ["$client", 0] }, action: "retain", _synced: false } },
        { $sort: { line: 1 } },
        {
          $project: {
            line: 1,
            client: { $ifNull: ["$client._id", null] },
            clientName: { $ifNull: ["$client.name", null] },
            particular: 1,
            acctCodeId: "$acctCode._id",
            acctCodeLabel: "$acctCode.description",
            debit: 1,
            credit: 1,
            _synced: 1,
            action: 1,
          },
        },
      ],
      as: "entries",
    },
  });

  const damayanFunds = await DamayanFund.aggregate(pipelines).exec();

  return { success: true, damayanFunds };
};

exports.sync_damayan_fund_with_entries = async (damayanFunds, author) => {
  const toCreate = damayanFunds.filter(e => e.action === "create");
  const toUpdate = damayanFunds.filter(e => e.action === "update");
  const toDelete = damayanFunds.filter(e => e.action === "delete");

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (toCreate.length > 0) await createDamayanFundsHelper(toCreate, author, session);
    if (toUpdate.length > 0) await updateDamayanFundsHelper(toUpdate, author, session);
    if (toDelete.length > 0) await deleteDamayanFundsHelper(toDelete, author, session);

    await session.commitTransaction();

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(error.message || "Failed to sync acknowledgement receipts", error.statusCode || 500);
  } finally {
    await session.endSession();
  }
};
