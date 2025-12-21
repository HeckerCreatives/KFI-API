const { completeNumberDate, getMonth, getYear } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");
const XLSX = require("xlsx-js-style");

exports.exportActivityReporExcel = (entries, beginningBalance, from, to) => {
  const rows = [];
  let topBottomBorder = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "none" }, right: { style: "none" } };
  let topBorder = { top: { style: "thin" }, bottom: { style: "none" }, left: { style: "none" }, right: { style: "none" } };

  let totalDebit = 0;
  let totalCredit = 0;

  rows.push([
    { v: "Doc. No.", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Date", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Month", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "Year", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "Debit", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "Credit", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "Remarks", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: topBottomBorder } },
  ]);

  entries.map((chart, i) => {
    rows.push([{ v: chart.description, t: "s", s: { alignment: { vertical: "center", horizontal: "left" } } }]);
    chart.entries.map((entry, h) => {
      if (beginningBalance && i === 0 && h === 0) {
        totalDebit += Number(beginningBalance?.debit || 0);
        totalCredit += Number(beginningBalance?.credit || 0);

        rows.push([
          { v: `Beg. Balance`, t: "s", s: { alignment: { vertical: "center" } } },
          { v: `${completeNumberDate(from)}`, t: "s", s: { alignment: { vertical: "center" } } },
          { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
          { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
          { v: `${formatNumber(beginningBalance.debit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
          { v: `${formatNumber(beginningBalance.credit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
          { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        ]);
      }

      totalDebit += Number(entry?.debit || 0);
      totalCredit += Number(entry?.credit || 0);

      rows.push([
        { v: `${entry.doc}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${completeNumberDate(entry.date)}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${getMonth(entry.date)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: `${getYear(entry.date)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: `${formatNumber(entry.debit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: `${formatNumber(entry.credit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: `${entry?.particular || ""}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      ]);
    });
  });

  const difference = totalDebit - totalCredit;

  rows.push([]);
  rows.push([
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${formatNumber(totalDebit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBorder } },
    { v: `${formatNumber(totalCredit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBorder } },
    { v: `${formatNumber(Math.abs(difference))}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
  ]);

  rows.push([]);
  rows.push([
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${formatNumber(totalDebit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBorder } },
    { v: `${formatNumber(totalCredit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBorder } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
  ]);

  rows.push([]);
  rows.push([
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${formatNumber(difference >= 0 ? Math.abs(difference) : 0)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBorder } },
    { v: `${formatNumber(difference <= 0 ? Math.abs(difference) : 0)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBorder } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
  ]);

  rows.push([]);
  rows.push([
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${formatNumber(totalDebit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBorder } },
    { v: `${formatNumber(totalCredit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBorder } },
    { v: `${formatNumber(Math.abs(difference))}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
  ]);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows, { origin: "A7" });

  worksheet["!cols"] = Array.from(Array(14)).fill({ wch: 20 });

  let title = "";
  if (from && !to) title = `Period Covered From ${completeNumberDate(from)}`;
  if (to && !from) title = `Period Covered To ${completeNumberDate(to)}`;
  if (to && from) title = `Period Covered From ${completeNumberDate(from)} To ${completeNumberDate(to)}`;

  const headerTitle = "KAALALAY FOUNDATION, INC. (LB)";
  const headerSubtitle = `G / L Activity`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [title], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "General Ledger Activity Report");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  return excelBuffer;
};
