const SignatureParam = require("../smscr/system-parameters/signature-param");

exports.initializeSignatureParams = async () => {
  const signatures = [
    { type: "loan release", approvedBy: "ABE", checkedBy: "MGP", receivedBy: "" },
    { type: "expense voucher", approvedBy: "ABE", checkedBy: "MGP", receivedBy: "" },
    { type: "journal voucher", approvedBy: "ABE", checkedBy: "MGP", receivedBy: "" },
    { type: "official receipt", approvedBy: "ABE", checkedBy: "MGP", receivedBy: "" },
    { type: "acknowledgement receipt", approvedBy: "ABE", checkedBy: "MGP", receivedBy: "" },
    { type: "damayan fund", approvedBy: "ABE", checkedBy: "MGP", receivedBy: "" },
    { type: "emergency loan", approvedBy: "ABE", checkedBy: "MGP", receivedBy: "" },
    { type: "soa", approvedBy: "ABE", checkedBy: "MGP", receivedBy: "" },
  ];

  await SignatureParam.insertMany(signatures);
};
