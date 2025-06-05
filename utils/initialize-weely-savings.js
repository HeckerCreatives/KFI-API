const WeeklySaving = require("../smscr/weekly-saving/weekly-saving.schema.js");

exports.initializeWeeklySavings = async () => {
  try {
    const savings = [
      { rangeAmountFrom: 5000, rangeAmountTo: 5000, weeklySavingsFund: 20 },
      { rangeAmountFrom: 6000, rangeAmountTo: 10000, weeklySavingsFund: 30 },
      { rangeAmountFrom: 11000, rangeAmountTo: 15000, weeklySavingsFund: 35 },
      { rangeAmountFrom: 16000, rangeAmountTo: 20000, weeklySavingsFund: 40 },
      { rangeAmountFrom: 21000, rangeAmountTo: 25000, weeklySavingsFund: 45 },
      { rangeAmountFrom: 26000, rangeAmountTo: 30000, weeklySavingsFund: 50 },
      { rangeAmountFrom: 31000, rangeAmountTo: 40000, weeklySavingsFund: 55 },
      { rangeAmountFrom: 41000, rangeAmountTo: 50000, weeklySavingsFund: 60 },
      { rangeAmountFrom: 51000, rangeAmountTo: 60000, weeklySavingsFund: 65 },
      { rangeAmountFrom: 61000, rangeAmountTo: 70000, weeklySavingsFund: 70 },
      { rangeAmountFrom: 71000, rangeAmountTo: 80000, weeklySavingsFund: 75 },
      { rangeAmountFrom: 81000, rangeAmountTo: 90000, weeklySavingsFund: 80 },
      { rangeAmountFrom: 91000, rangeAmountTo: 100000, weeklySavingsFund: 85 },
      { rangeAmountFrom: 100000, rangeAmountTo: 500000, weeklySavingsFund: 85 },
    ];

    await WeeklySaving.insertMany(savings);
  } catch (error) {
    console.log("FAILED TO INITIALIZE WEEKLY SAVINGS");
  }
};
