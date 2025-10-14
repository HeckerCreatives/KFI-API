exports.orEntryCodes = ["4045"];

exports.arEntryCodes = type => {
  return type === "payments" ? ["2000A", "2010C", "2010D"] : ["2000A", "4045", "2010C", "2010D"];
};
