const CustomError = require("../../../utils/custom-error.js");
const Center = require("../../center/center.schema.js");
const SignatureParam = require("../../system-parameters/signature-param.js");
const Transaction = require("../../transactions/transaction.schema.js");
const activityLogServ = require("../../activity-logs/activity-log.service.js");
const { createLoanReleaseEntriesHelper, updateLoanReleaseEntriesHelper, deleteLoanReleaseEntriesHelper } = require("./sync.loan-release-entry.helper.js");
const Entry = require("../../transactions/entries/entry.schema.js");
const { setPaymentDates } = require("../../../utils/date.js");
const PaymentSchedule = require("../../payment-schedules/payment-schedule.schema.js");

exports.createLoanReleasesHelper = async (loanReleases, author, session) => {
  await Promise.all(
    loanReleases.map(async data => {
      const signature = await SignatureParam.findOne({ type: "loan release" }).lean().exec();
      const center = await Center.findById(data.center).lean().exec();

      const newLoanRelease = await new Transaction({
        type: "loan release",
        code: data.code.toUpperCase(),
        center: data.center,
        refNo: data.refNo,
        remarks: data.remarks,
        date: data.date,
        acctMonth: data.acctMonth,
        acctYear: data.acctYear,
        acctOfficer: center.acctOfficer,
        noOfWeeks: data.noOfWeeks,
        loan: data.loan,
        checkNo: data?.checkNo || "",
        checkDate: data.checkDate,
        bank: data.bank,
        amount: data.amount,
        cycle: data?.cycle || "",
        interest: data.interest,
        isEduc: false,
        encodedBy: author._id,
        preparedBy: author.username,
        checkedBy: signature.checkedBy,
        approvedBy: signature.approvedBy,
        receivedBy: signature.receivedBy,
      }).save({ session });

      if (!newLoanRelease) {
        throw new CustomError("Failed to save loan release");
      }

      const dueDates = setPaymentDates(newLoanRelease.noOfWeeks, newLoanRelease.date);
      const paymentSchedules = dueDates.map(due => ({
        loanRelease: newLoanRelease._id,
        week: due.week,
        date: due.date,
        paid: due.paid,
      }));

      const dues = await PaymentSchedule.insertMany(paymentSchedules, { session });
      if (dues.length !== paymentSchedules.length) {
        throw new CustomError("Failed to create due dates. Please try again", 500);
      }

      await activityLogServ.create({
        author: author._id,
        username: author.username,
        activity: `created a loan release`,
        resource: `loan release`,
        dataId: newLoanRelease._id,
        session,
      });

      const entriesToCreate = data.entries.filter(entry => entry.action === "create");
      const entriesToUpdate = data.entries.filter(entry => entry.action === "update");
      const entriesToDelete = data.entries.filter(entry => entry.action === "delete");

      if (entriesToCreate.length > 0) await createLoanReleaseEntriesHelper(newLoanRelease, entriesToCreate, author, session);
      if (entriesToUpdate.length > 0) await updateLoanReleaseEntriesHelper(newLoanRelease, entriesToUpdate, author, session);
      if (entriesToDelete.length > 0) await deleteLoanReleaseEntriesHelper(newLoanRelease, entriesToDelete, author, session);
    })
  );
};

exports.updateLoanReleasesHelper = async (loanReleases, author, session) => {
  await Promise.all(
    loanReleases.map(async data => {
      const filter = { deletedAt: null, _id: data._id };
      const lrUpdates = { $set: { amount: data.amount, interest: data.interest, cycle: data.cycle } };
      const lrOptions = { session };

      const updatedLoanRelease = await Transaction.findOneAndUpdate(filter, lrUpdates, lrOptions).lean().exec();
      if (!updatedLoanRelease) {
        throw new CustomError("Failed to update the loan release", 500);
      }

      await activityLogServ.create({
        author: author._id,
        username: author.username,
        activity: `updated a loan release along with its entries`,
        resource: `loan release`,
        dataId: updatedLoanRelease._id,
        session,
      });

      const entriesToCreate = data.entries.filter(entry => entry.action === "create");
      const entriesToUpdate = data.entries.filter(entry => entry.action === "update");
      const entriesToDelete = data.entries.filter(entry => entry.action === "delete");

      if (entriesToCreate.length > 0) await createLoanReleaseEntriesHelper(updatedLoanRelease, entriesToCreate, author, session);
      if (entriesToUpdate.length > 0) await updateLoanReleaseEntriesHelper(updatedLoanRelease, entriesToUpdate, author, session);
      if (entriesToDelete.length > 0) await deleteLoanReleaseEntriesHelper(updatedLoanRelease, entriesToDelete, author, session);
    })
  );
};

exports.deleteLoanReleasesHelper = async (loanReleases, author, session) => {
  const loanReleaseIds = loanReleases.map(e => e._id);
  const filter = { _id: { $in: loanReleaseIds }, deletedAt: null };

  const deletedLoanRelease = await Transaction.updateMany(filter, { $set: { deletedAt: new Date().toISOString() } }).exec();
  if (deletedLoanRelease.matchedCount !== loanReleases.length) {
    throw new CustomError("Failed to sync the loan release", 500);
  }
  await Entry.updateMany({ transaction: { $in: loanReleaseIds } }, { $set: { deletedAt: new Date().toISOString() } }).exec();

  await activityLogServ.bulk_create({
    loanReleaseIds,
    author: author._id,
    username: author.username,
    activity: `deleted a loan release along with its linked gl entries`,
    resource: `loan release`,
    session,
  });
};
