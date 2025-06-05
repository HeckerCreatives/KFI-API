const xlsx = require("xlsx");
const path = require("path");
const ChartOfAccount = require("../smscr/chart-of-account/chart-of-account.schema.js");

exports.initializeChartOfAccount = async () => {
  try {
    const excelPath = path.join(global.rootDir, "utils", "files", "chart-of-account.xls");
    const workbook = xlsx.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    const datas = [];
    jsonData.map((e, i) => {
      if (i <= 4) return;
      datas.push({
        code: e.__EMPTY,
        description: e.__EMPTY_2,
        nature: e.__EMPTY_7,
        classification: e.__EMPTY_8,
        deptStatus: e.__EMPTY_10,
      });
    });

    await ChartOfAccount.insertMany(datas);
  } catch (error) {
    console.log("FAILED TO INITIALIZE CHART OF ACCOUNT");
  }
};
