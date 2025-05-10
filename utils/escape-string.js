exports.stringEscape = str => {
  return str ? str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";
};
