const Customer = require("../customer/customer.schema.js");

exports.dashboard_card_statistics = async () => {
  const total_promise = Customer.countDocuments({ deletedAt: null });
  const total_active_promise = Customer.countDocuments({ deletedAt: null, memberStatus: "active" });
  const total_inactive_promise = Customer.countDocuments({ deletedAt: null, memberStatus: "inactive" });

  const [total, total_active, total_inactive] = await Promise.all([total_promise, total_active_promise, total_inactive_promise]);

  return {
    totalMembers: total,
    totalActiveMembers: total_active,
    totalInactiveMembers: total_inactive,
  };
};

exports.loans_per_account_officer = async () => {};

exports.recent_loan = async () => {};

exports.recent_member = async () => {};
