const CustomError = require("../../../utils/custom-error");
const EmergencyLoan = require("../../emergency-loan/emergency-loan.schema");
const activityLogServ = require("../../activity-logs/activity-log.service.js");
const { createEmergencyLoanEntriesHelper, updateEmergencyLoanEntriesHelper, deleteEmergencyLoanEntriesHelper } = require("./sync.emergency-loan-entry.helper");
const EmergencyLoanEntry = require("../../emergency-loan/entries/emergency-loan-entry.schema");
const SignatureParam = require("../../system-parameters/signature-param");

exports.createEmergencyLoansHelper = async (emergencies, author, session) => {
  await Promise.all(
    emergencies.map(async data => {
      const signature = await SignatureParam.findOne({ type: "emergency loan" }).lean().exec();
      const newEmergencyLoan = await new EmergencyLoan({
        code: data.code.toUpperCase(),
        client: data.clientValue,
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

      if (!newEmergencyLoan) {
        throw new CustomError("Failed to create a new emergency loan", 500);
      }

      await activityLogServ.create({
        author: author._id,
        username: author.username,
        activity: `created an emergency loan`,
        resource: `emergency loan`,
        dataId: newEmergencyLoan._id,
        session,
      });

      const entriesToCreate = data.entries.filter(entry => entry.action === "create");
      const entriesToUpdate = data.entries.filter(entry => entry.action === "update");
      const entriesToDelete = data.entries.filter(entry => entry.action === "delete");

      if (entriesToCreate.length > 0) await createEmergencyLoanEntriesHelper(newEmergencyLoan, entriesToCreate, author, session);
      if (entriesToUpdate.length > 0) await updateEmergencyLoanEntriesHelper(newEmergencyLoan, entriesToUpdate, author, session);
      if (entriesToDelete.length > 0) await deleteEmergencyLoanEntriesHelper(newEmergencyLoan, entriesToDelete, author, session);
    })
  );
};

exports.updateEmergencyLoansHelper = async (emergencies, author, session) => {
  await Promise.all(
    emergencies.map(async data => {
      const filter = { deletedAt: null, _id: data._id };
      const updates = {
        $set: {
          code: data.code.toUpperCase(),
          client: data.clientValue,
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

      const updated = await EmergencyLoan.findOneAndUpdate(filter, updates, options).lean().exec();
      if (!updated) {
        throw new CustomError("Failed to sync the emergency loan", 500);
      }

      await activityLogServ.create({
        author: author._id,
        username: author.username,
        activity: `updated a emergency loan along with its entries`,
        resource: `emergency loan`,
        dataId: updated._id,
        session,
      });

      const entriesToCreate = data.entries.filter(entry => entry.action === "create");
      const entriesToUpdate = data.entries.filter(entry => entry.action === "update");
      const entriesToDelete = data.entries.filter(entry => entry.action === "delete");

      if (entriesToCreate.length > 0) await createEmergencyLoanEntriesHelper(updated, entriesToCreate, author, session);
      if (entriesToUpdate.length > 0) await updateEmergencyLoanEntriesHelper(updated, entriesToUpdate, author, session);
      if (entriesToDelete.length > 0) await deleteEmergencyLoanEntriesHelper(updated, entriesToDelete, author, session);
    })
  );
};

exports.deleteEmergencyLoansHelper = async (emergencies, author, session) => {
  const ids = emergencies.map(e => e._id);
  const filter = { _id: { $in: ids }, deletedAt: null };

  const deleted = await EmergencyLoan.updateMany(filter, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();
  if (deleted.matchedCount !== emergencies.length) {
    throw new CustomError("Failed to sync the emergency loans", 500);
  }
  await EmergencyLoanEntry.updateMany({ emergencyLoan: { $in: ids } }, { $set: { deletedAt: new Date().toISOString() } }, { session }).exec();

  await activityLogServ.bulk_create({
    ids,
    author: author._id,
    username: author.username,
    activity: `deleted a emergency loan along with its entries`,
    resource: `emergency loan`,
    session,
  });
};
