const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");
const XLSX = require("xlsx-js-style");

exports.exportJVDetailedByDate = (journalVouchers, from, to) => {
  const journals = [];

  let totalAmount = 0;

  let topBottomBorder = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "none" }, right: { style: "none" } };
  let bottomBorder = { top: { style: "none" }, bottom: { style: "thin" }, left: { style: "none" }, right: { style: "none" } };

  journals.push([
    { v: "Date", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Doc. No.", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Nature", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Particulars", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Amount", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  journalVouchers.map(data => {
    totalAmount += Number(data.amount);
    let totalDebit = 0;
    let totalCredit = 0;

    journals.push(
      [
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${data?.remarks || ""}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${formatNumber(data.amount)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      ],
      Array.from({ length: 8 }, () => ({ v: ``, t: "s", s: { alignment: { vertical: "center" } } })),
      [
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `GL Code`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: bottomBorder } },
        { v: `Account Title`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: bottomBorder } },
        { v: `Debit`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: bottomBorder } },
        { v: `Credit`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: bottomBorder } },
        { v: `Ctr Code - Client Name`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: bottomBorder } },
      ],
      ...data.entries.map(entry => {
        totalDebit += Number(entry.debit);
        totalCredit += Number(entry.credit);
        return [
          { v: `${completeNumberDate(data.date)}`, t: "s", s: { alignment: { vertical: "center" } } },
          { v: `${data.code}`, t: "s", s: { alignment: { vertical: "center" } } },
          { v: `${data?.nature || ""}`, t: "s", s: { alignment: { vertical: "center" } } },
          { v: `${entry.acctCode.code}`, t: "s", s: { alignment: { vertical: "center" } } },
          { v: `${entry.acctCode.description}`, t: "s", s: { alignment: { vertical: "center" } } },
          { v: `${formatNumber(entry.debit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
          { v: `${formatNumber(entry.credit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
          {
            v: entry.client?.center?.centerNo ? `${entry.client?.center?.centerNo} - ${entry.client?.name}` : "",
            t: "s",
            s: { alignment: { vertical: "center" } },
          },
        ];
      }),
      Array.from({ length: 8 }, () => ({ v: ``, t: "s", s: { alignment: { vertical: "center" } } })),
      [
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${formatNumber(totalDebit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
        { v: `${formatNumber(totalCredit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      ],
      Array.from({ length: 8 }, () => ({ v: ``, t: "s", s: { alignment: { vertical: "center" } } })),
      [
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${formatNumber(totalDebit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
        { v: `${formatNumber(totalCredit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      ],
      Array.from({ length: 8 }, () => ({ v: ``, t: "s", s: { alignment: { vertical: "center" } } })),
      Array.from({ length: 8 }, () => ({ v: ``, t: "s", s: { alignment: { vertical: "center" } } }))
    );
  });

  journals.push([
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: `Grand Total: `, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: `${formatNumber(totalAmount)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
  ]);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(journals, { origin: "A7" });

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
