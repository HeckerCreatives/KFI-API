const { bankCodes } = require("../../../constants/bank-codes");
const { loanCodes } = require("../../../constants/loan-codes");
const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");
const XLSX = require("xlsx-js-style");

exports.exportDetailedByDate = (transactions, from, to) => {
  const formattedLoanReleases = [];
  let totalAmount = 0;
  let totalPrincipal = 0;
  let totalMisc = 0;

  let topBottomBorder = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "none" }, right: { style: "none" } };

  formattedLoanReleases.push([
    { v: "Date", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Doc. No.", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Center", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Bank", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Check No.", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Check Date", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Principal", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "Interest", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "WSF", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "Damayan", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "CGT", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "Emergency", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "Misc.", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "Amount", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  transactions.map(data => {
    totalAmount += Number(data.amount);

    const principal = data.entries.reduce((acc, entry) => {
      if (loanCodes.includes(entry.acctCode.code)) acc += Number(entry?.debit || 0);
      return acc;
    }, 0);
    totalPrincipal += principal;

    const misc = data.entries.reduce((acc, entry) => {
      let code = entry.acctCode.code;
      if (!loanCodes.includes(code) && !bankCodes.includes(code)) acc += Number(entry?.credit || 0);
      return acc;
    }, 0);
    totalMisc += misc;

    formattedLoanReleases.push([
      { v: `${completeNumberDate(data.date)}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${data.code}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${data.center.centerNo} - ${data.center.description}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${data.bank.description}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${data?.checkNo || ""}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${completeNumberDate(data.checkDate)}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${formatNumber(principal)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `0.00`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `0.00`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `0.00`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `0.00`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `0.00`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${formatNumber(misc)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${formatNumber(data.amount)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    ]);
  });

  formattedLoanReleases.push([
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${formatNumber(totalPrincipal)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `0.00`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `0.00`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `0.00`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `0.00`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `0.00`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalMisc)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalAmount)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(formattedLoanReleases, { origin: "A7" });

  worksheet["!cols"] = Array.from(Array(14)).fill({ wch: 20 });

  let title = "";
  if (from && !to) title = `Period Covered: From ${from}`;
  if (to && !from) title = `Period Covered: To ${to}`;
  if (to && from) title = `Period Covered: From ${from} To ${to}`;

  const headerTitle = "KAALALAY FOUNDATION, INC. (LB)";
  const headerSubtitle = `Loan Release By Date ( Detailed )`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [title], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Loan Release");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  return excelBuffer;
};
