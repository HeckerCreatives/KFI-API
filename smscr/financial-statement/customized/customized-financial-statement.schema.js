const mongoose = require("mongoose");

const customizedFinancialStatement = new mongoose.Schema();

customizedFinancialStatement.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
  },
});

const CustomizeFinancialStatement = mongoose.model("Customer", customizedFinancialStatement);

module.exports = CustomizeFinancialStatement;
