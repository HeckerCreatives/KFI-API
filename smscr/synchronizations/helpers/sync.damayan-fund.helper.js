const CustomError = require("../../../utils/custom-error.js");
const activityLogServ = require("../../activity-logs/activity-log.service.js");
const DamayanFund = require("../../damayan-fund/damayan-fund.schema.js");
const DamayanFundEntry = require("../../damayan-fund/entries/damayan-fund-entries.schema.js");
const SignatureParam = require("../../system-parameters/signature-param.js");
const { createDamayanFundEntriesHelper, updateDamayanFundEntriesHelper, deleteDamayanFundEntriesHelper } = require("./sync.damayan-fund-entry.helper.js");

exports.createDamayanFundsHelper = async (damayans, author, session) => {
  await Promise.all(
    damayans.map(async data => {
      const signature = await SignatureParam.findOne({ type: "damayan fund" }).lean().exec();
      const newDamayanFund = await new DamayanFund({
        code: data.code.toUpperCase(),
        nature: data.nature,
        center: data.center,
        name: data.name,
        refNo: data.refNo,
        remarks: data.remarks,
        date: data.date,
        acctMonth: data.acctMonth,
        acctYear: data.acctYear,
        checkNo: data.checkNo,
        checkDate: data.checkDate,
        bankCode: data.bankCode,
        amount: data.amount,
        encodedBy: author._id,
        preparedBy: author.username,
        checkedBy: signature.checkedBy,
        approvedBy: signature.approvedBy,
        receivedBy: signature.receivedBy,
      }).save({ session });

      if (!newDamayanFund) {
        throw new CustomError("Failed to create a new damayan fund", 500);
      }

      await activityLogServ.create({
        author: author._id,
        username: author.username,
        activity: `created an damayan fund`,
        resource: `damayan fund`,
        dataId: newDamayanFund._id,
        session,
      });

      const entriesToCreate = data.entries.filter(entry => entry.action === "create");
      const entriesToUpdate = data.entries.filter(entry => entry.action === "update");
      const entriesToDelete = data.entries.filter(entry => entry.action === "delete");

      if (entriesToCreate.length > 0) await createDamayanFundEntriesHelper(newDamayanFund, entriesToCreate, author, session);
      if (entriesToUpdate.length > 0) await updateDamayanFundEntriesHelper(newDamayanFund, entriesToUpdate, author, session);
      if (entriesToDelete.length > 0) await deleteDamayanFundEntriesHelper(newDamayanFund, entriesToDelete, author, session);
    })
  );
};

exports.updateDamayanFundsHelper = async (damayans, author, session) => {
  await Promise.all(
    damayans.map(async data => {
      const filter = { deletedAt: null, _id: data._id };
      const updates = {
        $set: {
          code: data.code.toUpperCase(),
          nature: data.nature,
          center: data.center,
          name: data.name,
          refNo: data.refNo,
          remarks: data.remarks,
          date: data.date,
          acctMonth: data.acctMonth,
          acctYear: data.acctYear,
          checkNo: data.checkNo,
          checkDate: data.checkDate,
          bankCode: data.bankCode,
          amount: data.amount,
        },
      };
      const options = { session };

      const updated = await DamayanFund.findOneAndUpdate(filter, updates, options).lean().exec();
      if (!updated) {
        throw new CustomError("Failed to sync the damayan fund", 500);
      }

      await activityLogServ.create({
        author: author._id,
        username: author.username,
        activity: `updated a damayan fund along with its entries`,
        resource: `damayan fund`,
        dataId: updated._id,
        session,
      });

      const entriesToCreate = data.entries.filter(entry => entry.action === "create");
      const entriesToUpdate = data.entries.filter(entry => entry.action === "update");
      const entriesToDelete = data.entries.filter(entry => entry.action === "delete");

      if (entriesToCreate.length > 0) await createDamayanFundEntriesHelper(updated, entriesToCreate, author, session);
      if (entriesToUpdate.length > 0) await updateDamayanFundEntriesHelper(updated, entriesToUpdate, author, session);
      if (entriesToDelete.length > 0) await deleteDamayanFundEntriesHelper(updated, entriesToDelete, author, session);
    })
  );
};

exports.deleteDamayanFundsHelper = async (damayans, author, session) => {
  const ids = damayans.map(e => e._id);
  const filter = { _id: { $in: ids }, deletedAt: null };

  const deleted = await DamayanFund.updateMany(filter, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();
  if (deleted.matchedCount !== damayans.length) {
    throw new CustomError("Failed to sync the journal vouchers", 500);
  }
  await DamayanFundEntry.updateMany({ damayanFund: { $in: ids } }, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();

  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `deleted a damayan fund along with its entries`,
    resource: `damayan fund`,
    session,
  });
};
