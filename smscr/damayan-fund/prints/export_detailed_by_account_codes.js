const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");
const XLSX = require("xlsx-js-style");

exports.dfExportByAccounts = datas => {
  const rows = [];

  let topBottomBorder = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "none" }, right: { style: "none" } };
  let topBorder = { top: { style: "thin" }, bottom: { style: "none" }, left: { style: "none" }, right: { style: "none" } };

  rows.push([
    { v: "Payee", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Date.", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Doc. No.", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Particulars", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Debit", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "Credit", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  let totalDebit = 0;
  let totalCredit = 0;

  datas.map(data => {
    rows.push([{ v: `Account:  ${data.code} - ${data.description}`, t: "s", s: { alignment: { vertical: "center" } } }]);

    let loans = [];
    let astDebit = 0;
    let astCredit = 0;

    data.entries.map(entry => {
      let name = entry?.client ? `${entry?.client?.name}` : "NotApplicable";
      const isAdded = loans.findIndex(e => e.name === name);
      if (isAdded < 0) loans.push({ name, entries: [entry] });
      if (isAdded >= 0) loans[isAdded].entries.push(entry);
    });

    loans.map(loan => {
      let stDebit = 0;
      let stCredit = 0;
      loan.entries.map(entry => {
        stDebit += Number(entry?.debit || 0);
        stCredit += Number(entry?.credit || 0);
        rows.push([
          { v: entry?.client ? `${entry?.client?.name}` : "", t: "s", s: { alignment: { vertical: "center" } } },
          { v: `${completeNumberDate(entry.damayan.date)}`, t: "s", s: { alignment: { vertical: "center" } } },
          { v: `${entry.damayan.code}`, t: "s", s: { alignment: { vertical: "center" } } },
          { v: `${entry?.damayan?.remarks || ""}`, t: "s", s: { alignment: { vertical: "center" } } },
          { v: `${formatNumber(entry.debit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
          { v: `${formatNumber(entry.credit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        ]);
      });
      totalDebit += stDebit;
      totalCredit += stCredit;
      astDebit += stDebit;
      astCredit += stCredit;

      rows.push([
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `Sub-Total: `, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: `${formatNumber(stDebit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBorder } },
        { v: `${formatNumber(stCredit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBorder } },
      ]);
    });
    rows.push([...Array.from({ length: 6 }, () => ({ v: ``, t: "s", s: { alignment: { vertical: "center" } } }))]);
    rows.push([
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `Account Sub-Total: `, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${formatNumber(astDebit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBorder } },
      { v: `${formatNumber(astCredit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBorder } },
    ]);
  });
  rows.push([...Array.from({ length: 6 }, () => ({ v: ``, t: "s", s: { alignment: { vertical: "center" } } }))]);
  rows.push([
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: `Grand Total: `, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: `${formatNumber(totalDebit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalCredit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows, { origin: "A7" });

  worksheet["!cols"] = Array.from(Array(14)).fill({ wch: 20 });

  let title = "";

  const headerTitle = "KAALALAY FOUNDATION, INC. (LB)";
  const headerSubtitle = `Damayan Fund By Accounts (Sort By Supplier)`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [title], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Damayan Fund");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  return excelBuffer;
};
