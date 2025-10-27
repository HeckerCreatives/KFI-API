const { completeNumberDate } = require("../../../utils/date");
const XLSX = require("xlsx-js-style");
const { formatNumber } = require("../../../utils/number");

exports.ackExportByAccountsDetailed = (acknowledgements, from, to) => {
  const rows = [];

  let totalDebit = 0;
  let totalCredit = 0;

  let topBottomBorder = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "none" }, right: { style: "none" } };
  let topBorder = { top: { style: "thin" }, bottom: { style: "none" }, left: { style: "none" }, right: { style: "none" } };

  rows.push([
    { v: "Client", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Date", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Doc. No.", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Center", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Debit", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "Credit", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  acknowledgements.map(official => {
    let codeTotalDebit = 0;
    let codeTotalCredit = 0;

    rows.push([{ v: `${official.code} - ${official.description}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } }]);

    official.entries.map(data => {
      totalCredit += Number(data.credit);
      codeTotalCredit += Number(data.credit);
      totalDebit += Number(data.debit);
      codeTotalDebit += Number(data.debit);

      rows.push([
        { v: data?.client ? `${data.client.name}` : "", t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${completeNumberDate(data.acknowledgement.date)}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${data.acknowledgement.code}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${data.acknowledgement.center.centerNo} - ${data.acknowledgement.center.description}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${formatNumber(data.debit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: `${formatNumber(data.credit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      ]);
    });

    rows.push([
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${formatNumber(codeTotalDebit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBorder } },
      { v: `${formatNumber(codeTotalCredit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBorder } },
    ]);
  });

  rows.push([{ v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } }]);

  rows.push([
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: `Grand Total: `, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: `${formatNumber(totalDebit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalCredit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows, { origin: "A7" });

  worksheet["!cols"] = Array.from(Array(14)).fill({ wch: 20 });

  let title = "";
  if (from && !to) title = `Period Covered: From ${from}`;
  if (to && !from) title = `Period Covered: To ${to}`;
  if (to && from) title = `Period Covered: From ${from} To ${to}`;

  const headerTitle = "KAALALAY FOUNDATION, INC. (LB)";
  const headerSubtitle = `Official Receipt By Accounts ( Detailed )`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [title], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Official Receipt");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  return excelBuffer;
};
