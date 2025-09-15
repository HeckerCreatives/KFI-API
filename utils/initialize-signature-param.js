const SignatureParam = require("../smscr/system-parameters/signature-param");

exports.initializeSignatureParams = async () => {
  const signatures = [
    { type: "loan release", approvedBy: "ABE", checkedBy: "MGP" },
    { type: "expense voucher", approvedBy: "ABE", verifiedBy: "MGP" },
    { type: "journal voucher", approvedBy: "ABE", checkedBy: "MGP" },
    { type: "official receipt", checkedBy: "MGP", notedBy: "ABE" },
    { type: "damayan fund", approvedBy: "ABE", checkedBy: "MGP" },
    { type: "emergency loan", approvedBy: "ABE", checkedBy: "MGP" },
  ];

  await SignatureParam.insertMany(signatures);
};
