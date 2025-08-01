const chartOfAccountRoutes = require("../smscr/chart-of-account/chart-of-account.route");
const groupAccountRoutes = require("../smscr/group-account/group-account.route");
const centerRoutes = require("../smscr/center/center.route");
const bankRoutes = require("../smscr/banks/bank.route");
const supplierRoutes = require("../smscr/supplier/supplier.route");
const businessTypeRoutes = require("../smscr/business-type/business-type.route");
const loanRoutes = require("../smscr/loan/loan.route");
const customerRoutes = require("../smscr/customer/customer.route");
const beneficiaryRoutes = require("../smscr/beneficiary/beneficiary.route");
const childrenRoutes = require("../smscr/children/children.route");
const loanReleaseRoutes = require("../smscr/loan-release/loan-release.route");
const expenseVoucherRoutes = require("../smscr/expense-voucher/expense-voucher.route");
const journalVoucherRoutes = require("../smscr/journal-voucher/journal-voucher.route");
const natureRoutes = require("../smscr/nature/nature.route");
const officialReceiptRoutes = require("../smscr/official-receipt/official-receipt.route");
const emergencyLoanRoutes = require("../smscr/emergency-loan/emergency-loan.route");
const damayanFundRoutes = require("../smscr/damayan-fund/damayan-fund.route");
const weeklySavingRoutes = require("../smscr/weekly-saving/weekly-saving.route");
const weeklySavingTimeRoutes = require("../smscr/weekly-saving-time/weekly-saving-time.route");
const userRoutes = require("../smscr/user/user.route");
const passport = require("passport");
const authRoutes = require("../smscr/auth/auth.routes");
const optionRoutes = require("../smscr/options/options.route");
const statusRoutes = require("../smscr/status/status.routes");
const activityLogRoutes = require("../smscr/activity-logs/activity-log.route");
const transactionRoutes = require("../smscr/transactions/transaction.route");
const acknowledgementRoutes = require("../smscr/acknowledgement/acknowledgement.route");
const releaseRoutes = require("../smscr/release/release.route");
const statsRoutes = require("../smscr/statistics/statistics.route");

exports.routers = app => {
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/chart-of-account", passport.authenticate("jwt", { session: false }), chartOfAccountRoutes);
  app.use("/api/v1/group-account", passport.authenticate("jwt", { session: false }), groupAccountRoutes);
  app.use("/api/v1/center", passport.authenticate("jwt", { session: false }), centerRoutes);
  app.use("/api/v1/bank", passport.authenticate("jwt", { session: false }), bankRoutes);
  app.use("/api/v1/supplier", passport.authenticate("jwt", { session: false }), supplierRoutes);
  app.use("/api/v1/business-type", passport.authenticate("jwt", { session: false }), businessTypeRoutes);
  app.use("/api/v1/loan", passport.authenticate("jwt", { session: false }), loanRoutes);
  app.use("/api/v1/customer", passport.authenticate("jwt", { session: false }), customerRoutes);
  app.use("/api/v1/beneficiary", passport.authenticate("jwt", { session: false }), beneficiaryRoutes);
  app.use("/api/v1/children", passport.authenticate("jwt", { session: false }), childrenRoutes);
  app.use("/api/v1/loan-release", passport.authenticate("jwt", { session: false }), loanReleaseRoutes);
  app.use("/api/v1/expense-voucher", passport.authenticate("jwt", { session: false }), expenseVoucherRoutes);
  app.use("/api/v1/journal-voucher", passport.authenticate("jwt", { session: false }), journalVoucherRoutes);
  app.use("/api/v1/nature", passport.authenticate("jwt", { session: false }), natureRoutes);
  app.use("/api/v1/official-receipt", passport.authenticate("jwt", { session: false }), officialReceiptRoutes);
  app.use("/api/v1/emergency-loan", passport.authenticate("jwt", { session: false }), emergencyLoanRoutes);
  app.use("/api/v1/damayan-fund", passport.authenticate("jwt", { session: false }), damayanFundRoutes);
  app.use("/api/v1/weekly-saving", passport.authenticate("jwt", { session: false }), weeklySavingRoutes);
  app.use("/api/v1/weekly-saving-time", passport.authenticate("jwt", { session: false }), weeklySavingTimeRoutes);
  app.use("/api/v1/user", passport.authenticate("jwt", { session: false }), userRoutes);
  app.use("/api/v1/option", passport.authenticate("jwt", { session: false }), optionRoutes);
  app.use("/api/v1/status", passport.authenticate("jwt", { session: false }), statusRoutes);
  app.use("/api/v1/activity-log", passport.authenticate("jwt", { session: false }), activityLogRoutes);
  app.use("/api/v1/transaction", passport.authenticate("jwt", { session: false }), transactionRoutes);
  app.use("/api/v1/acknowledgement", passport.authenticate("jwt", { session: false }), acknowledgementRoutes);
  app.use("/api/v1/release", passport.authenticate("jwt", { session: false }), releaseRoutes);
  app.use("/api/v1/statistics", passport.authenticate("jwt", { session: false }), statsRoutes);
};
