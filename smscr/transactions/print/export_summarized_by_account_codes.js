const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");
const XLSX = require("xlsx-js-style");

exports.lrExportSummarizedByAccounts = (datas, from = "", to = "") => {
  const formattedLoanReleases = [];

  let topBottomBorder = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "none" }, right: { style: "none" } };

  formattedLoanReleases.push([
    { v: "Acct. Code", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Description", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Debit", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "Credit", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  let totalDebit = 0;
  let totalCredit = 0;

  datas.map(data => {
    let debit = data.entries.reduce((acc, obj) => (acc += Number(obj?.debit || 0)), 0);
    let credit = data.entries.reduce((acc, obj) => (acc += Number(obj?.credit || 0)), 0);
    formattedLoanReleases.push([
      { v: `${data.code}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${data.description}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${formatNumber(debit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${formatNumber(credit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    ]);
    totalDebit += debit;
    totalCredit += credit;
  });
  formattedLoanReleases.push([...Array.from({ length: 4 }, () => ({ v: ``, t: "s", s: { alignment: { vertical: "center" } } }))]);
  formattedLoanReleases.push([
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: `Grand Total: `, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: `${formatNumber(totalDebit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalCredit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(formattedLoanReleases, { origin: "A7" });

  worksheet["!cols"] = Array.from(Array(14)).fill({ wch: 20 });

  let title = "";
  if (from && !to) title = `Period Covered: From ${completeNumberDate(from)}`;
  if (to && !from) title = `Period Covered: To ${completeNumberDate(to)}`;
  if (to && from) title = `Period Covered: From ${completeNumberDate(from)} To ${completeNumberDate(to)}`;

  const headerTitle = "KAALALAY FOUNDATION, INC. (LB)";
  const headerSubtitle = `Loan Release By Accounts (Sort By Client)`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [title], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Loan Release");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  return excelBuffer;
};
