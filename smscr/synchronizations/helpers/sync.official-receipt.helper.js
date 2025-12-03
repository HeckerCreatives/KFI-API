const CustomError = require("../../../utils/custom-error");
const Acknowledgement = require("../../acknowledgement/acknowlegement.schema");
const SignatureParam = require("../../system-parameters/signature-param");
const activityLogServ = require("../../activity-logs/activity-log.service.js");
const { createOfficialReceiptEntriesHelper, updateOfficialReceiptEntriesHelper, deleteOfficialReceiptEntriesHelper } = require("./sync.official-receipt-entry.helper");
const AcknowledgementEntry = require("../../acknowledgement/entries/acknowledgement-entries.schema");

exports.createOfficialReceiptHelper = async (officials, author, session) => {
  await Promise.all(
    officials.map(async data => {
      const signature = await SignatureParam.findOne({ type: "official receipt" }).lean().exec();

      const newAcknowledgement = await new Acknowledgement({
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

      if (!newAcknowledgement) {
        throw new CustomError("Failed to save official receipt");
      }

      await activityLogServ.create({
        author: author._id,
        username: author.username,
        activity: `created an official receipt`,
        resource: `official receipt`,
        dataId: newAcknowledgement._id,
        session,
      });

      const entriesToCreate = data.entries.filter(entry => entry.action === "create");
      const entriesToUpdate = data.entries.filter(entry => entry.action === "update");
      const entriesToDelete = data.entries.filter(entry => entry.action === "delete");

      if (entriesToCreate.length > 0) await createOfficialReceiptEntriesHelper(newAcknowledgement, entriesToCreate, author, session);
      if (entriesToUpdate.length > 0) await updateOfficialReceiptEntriesHelper(newAcknowledgement, entriesToUpdate, author, session);
      if (entriesToDelete.length > 0) await deleteOfficialReceiptEntriesHelper(newAcknowledgement, entriesToDelete, author, session);
    })
  );
};

exports.updateOfficialReceiptHelper = async (officials, author, session) => {
  await Promise.all(
    officials.map(async data => {
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

      const updated = await Acknowledgement.findOneAndUpdate(filter, updates, options).lean().exec();
      if (!updated) {
        throw new CustomError("Failed to sync the official receipt", 500);
      }

      await activityLogServ.create({
        author: author._id,
        username: author.username,
        activity: `updated a official receipt along with its entries`,
        resource: `official receipt`,
        dataId: updated._id,
        session,
      });

      const entriesToCreate = data.entries.filter(entry => entry.action === "create");
      const entriesToUpdate = data.entries.filter(entry => entry.action === "update");
      const entriesToDelete = data.entries.filter(entry => entry.action === "delete");

      if (entriesToCreate.length > 0) await createOfficialReceiptEntriesHelper(updated, entriesToCreate, author, session);
      if (entriesToUpdate.length > 0) await updateOfficialReceiptEntriesHelper(updated, entriesToUpdate, author, session);
      if (entriesToDelete.length > 0) await deleteOfficialReceiptEntriesHelper(updated, entriesToDelete, author, session);
    })
  );
};

exports.deleteOfficialReceiptHelper = async (officials, author, session) => {
  const ids = officials.map(e => e._id);
  const filter = { _id: { $in: ids }, deletedAt: null };

  const deleted = await Acknowledgement.updateMany(filter, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();
  if (deleted.matchedCount !== officials.length) {
    throw new CustomError("Failed to sync the official receipts", 500);
  }
  await AcknowledgementEntry.updateMany({ acknowledgement: { $in: ids } }, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();

  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `deleted a official receipts along with its entries`,
    resource: `official receipt`,
    session,
  });
};
