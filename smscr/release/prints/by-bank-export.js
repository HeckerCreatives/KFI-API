const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");
const XLSX = require("xlsx-js-style");

exports.relExportByBanks = datas => {
  const rows = [];
  let totalAmount = 0;

  let topBottomBorder = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "none" }, right: { style: "none" } };

  rows.push([
    { v: "Check Date", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Check No.", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Doc. No.", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Center", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Account Officer", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Amount", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  datas.map((data, i) => {
    rows.push([
      { v: "Bank:", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: `${data.code} - ${data.description}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
    ]);

    let totalPerBank = 0;

    data.releases.map(release => {
      totalAmount += Number(release.amount);
      totalPerBank += Number(release.amount);

      rows.push([
        { v: `${completeNumberDate(release.checkDate)}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${release?.checkNo || ""}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${release.code}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${release?.center.centerNo} - ${release?.center.description}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${release?.acctOfficer || ""}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${formatNumber(release.amount)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      ]);
    });

    rows.push([
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `Bank Sub Total: `, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${formatNumber(totalPerBank)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    ]);

    rows.push(Array.from({ length: 6 }, () => ({ v: ``, t: "s", s: { alignment: { vertical: "center" } } })));
  });

  rows.push([
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: `${formatNumber(totalAmount)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows, { origin: "A7" });

  worksheet["!cols"] = Array.from(Array(14)).fill({ wch: 20 });

  let title = "";

  const headerTitle = "KAALALAY FOUNDATION, INC. (LB)";
  const headerSubtitle = `Acknowledgement Receipt By Banks`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [title], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Acknowledgement Receipts");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  return excelBuffer;
};
