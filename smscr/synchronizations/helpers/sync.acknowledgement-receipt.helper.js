const Release = require("../../release/release.schema.js");
const SignatureParam = require("../../system-parameters/signature-param.js");
const activityLogServ = require("../../activity-logs/activity-log.service.js");
const {
  createAcknowledgementReceiptEntriesHelper,
  updateAcknowledgementReceiptEntriesHelper,
  deleteAcknowledgementReceiptEntriesHelper,
} = require("./sync.acknowledgement-receipt-entry.helper");
const CustomError = require("../../../utils/custom-error.js");
const ReleaseEntry = require("../../release/entries/release-entries.schema");

exports.createAcknowledgemenetReceiptsHelper = async (acknowledgements, author, session) => {
  await Promise.all(
    acknowledgements.map(async data => {
      const signature = await SignatureParam.findOne({ type: "acknowledgement receipt" }).lean().exec();

      const newRelease = await new Release({
        code: data.code.toUpperCase(),
        center: data.center,
        refNo: data.refNumber,
        remarks: data.remarks,
        type: data.type,
        acctOfficer: data.acctOfficer,
        date: data.date,
        acctMonth: data.acctMonth,
        acctYear: data.acctYear,
        checkNo: data.checkNo,
        checkDate: data.checkDate,
        bankCode: data.bankCode,
        amount: data.amount,
        cashCollectionAmount: data.cashCollection,
        encodedBy: author._id,
        preparedBy: author.username,
        checkedBy: signature.checkedBy,
        approvedBy: signature.approvedBy,
        receivedBy: signature.receivedBy,
        datePosted: new Date(),
      }).save({ session });

      if (!newRelease) {
        throw new CustomError("Failed to sync acknowledgement receipt");
      }

      await activityLogServ.create({
        author: author._id,
        username: author.username,
        activity: `created an acknowledgement receipt`,
        resource: `acknowledgement receipt`,
        dataId: newRelease._id,
        session,
      });

      const entriesToCreate = data.entries.filter(entry => entry.action === "create");
      const entriesToUpdate = data.entries.filter(entry => entry.action === "update");
      const entriesToDelete = data.entries.filter(entry => entry.action === "delete");

      if (entriesToCreate.length > 0) await createAcknowledgementReceiptEntriesHelper(newRelease, entriesToCreate, author, session);
      if (entriesToUpdate.length > 0) await updateAcknowledgementReceiptEntriesHelper(newRelease, entriesToUpdate, author, session);
      if (entriesToDelete.length > 0) await deleteAcknowledgementReceiptEntriesHelper(newRelease, entriesToDelete, author, session);
    })
  );
};

exports.updateAcknowledgemenetReceiptsHelper = async (acknowledgements, author, session) => {
  await Promise.all(
    acknowledgements.map(async data => {
      const filter = { deletedAt: null, _id: data._id };
      const updates = {
        $set: {
          code: data.code.toUpperCase(),
          center: data.center,
          refNo: data.refNumber,
          remarks: data.remarks,
          type: data.type,
          acctOfficer: data.acctOfficer,
          date: data.date,
          acctMonth: data.acctMonth,
          acctYear: data.acctYear,
          checkNo: data.checkNo,
          checkDate: data.checkDate,
          bankCode: data.bankCode,
          amount: data.amount,
          cashCollectionAmount: data.cashCollection,
        },
      };
      const options = { session };

      const updated = await Release.findOneAndUpdate(filter, updates, options).lean().exec();
      if (!updated) {
        throw new CustomError("Failed to sync the acknowledgement receipt", 500);
      }

      await activityLogServ.create({
        author: author._id,
        username: author.username,
        activity: `updated a acknowledgement receipt along with its entries`,
        resource: `acknowledgement receipt`,
        dataId: updated._id,
        session,
      });

      const entriesToCreate = data.entries.filter(entry => entry.action === "create");
      const entriesToUpdate = data.entries.filter(entry => entry.action === "update");
      const entriesToDelete = data.entries.filter(entry => entry.action === "delete");

      if (entriesToCreate.length > 0) await createAcknowledgementReceiptEntriesHelper(updated, entriesToCreate, author, session);
      if (entriesToUpdate.length > 0) await updateAcknowledgementReceiptEntriesHelper(updated, entriesToUpdate, author, session);
      if (entriesToDelete.length > 0) await deleteAcknowledgementReceiptEntriesHelper(updated, entriesToDelete, author, session);
    })
  );
};

exports.deleteAcknowledgemenetReceiptsHelper = async (acknowledgements, author, session) => {
  const ids = acknowledgements.map(e => e._id);
  const filter = { _id: { $in: ids }, deletedAt: null };

  const deleted = await Release.updateMany(filter, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();
  if (deleted.matchedCount !== acknowledgements.length) {
    throw new CustomError("Failed to sync the acknowledgement receipt", 500);
  }
  await ReleaseEntry.updateMany({ release: { $in: ids } }, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();

  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `deleted a acknowledgement receipt along with its entries`,
    resource: `acknowledgement receipt`,
    session,
  });
};
