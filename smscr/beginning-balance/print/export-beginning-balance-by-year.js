const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");
const XLSX = require("xlsx-js-style");

exports.exportBeginningBalanceByYearExcel = (beginningBalance, entries) => {
  let totalDebit = 0;
  let totalCredit = 0;
  let beginningBalances = [];

  let topBottomBorder = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "none" }, right: { style: "none" } };

  beginningBalances.push([
    { v: `Doc. No: BEGBAL${beginningBalance.year}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
    { v: `Department`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
    { v: `Date: 1/1/${beginningBalance.year}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
  ]);

  beginningBalances.push([
    { v: `Acct. Mon.: 0`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
    { v: `Year: ${beginningBalance.year}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
    { v: `Book`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
  ]);

  beginningBalances.push([
    { v: `Ref. No.:`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
    { v: `Remarks:`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
  ]);

  beginningBalances.push([
    { v: `Memo: ${beginningBalance.memo}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
  ]);

  beginningBalances.push([{ v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } }]);

  beginningBalances.push([
    { v: "Account Code", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Account Description", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Debit", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "Credit", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  entries
    .sort((a, b) => a.acctCode.code.localeCompare(b.acctCode.code))
    .map(data => {
      totalDebit += Number(data.debit);
      totalCredit += Number(data.credit);
      beginningBalances.push([
        { v: data.acctCode.code, t: "s", s: { alignment: { vertical: "center" } } },
        { v: data.acctCode.description, t: "s", s: { alignment: { vertical: "center" } } },
        { v: formatNumber(data.debit), t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: formatNumber(data.credit), t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      ]);
    });

  beginningBalances.push([
    { v: "", t: "s", s: { alignment: { vertical: "center" } } },
    { v: "Total: ", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: formatNumber(totalDebit), t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: formatNumber(totalCredit), t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(beginningBalances, { origin: "A5" });

  worksheet["!cols"] = Array.from(Array(14)).fill({ wch: 20 });

  const headerSubtitle = `G/L Journal Entries`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerSubtitle], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Beginning Balance");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  return excelBuffer;
};
