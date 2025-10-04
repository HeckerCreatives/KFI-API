const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");
const XLSX = require("xlsx-js-style");

exports.jVExportByBanks = datas => {
  const journalVouchers = [];
  let totalAmount = 0;

  let topBottomBorder = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "none" }, right: { style: "none" } };

  journalVouchers.push([
    { v: "Check Date", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Check No.", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Doc. No.", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Nature", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Particulars", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Amount", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  datas.map((data, i) => {
    journalVouchers.push([
      { v: "Bank:", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: `${data.code} - ${data.description}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
    ]);

    let totalPerBank = 0;

    data.journals.map(journal => {
      totalAmount += Number(journal.amount);
      totalPerBank += Number(journal.amount);

      journalVouchers.push([
        { v: `${completeNumberDate(journal.checkDate)}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${journal?.checkNo || ""}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${journal.code}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${journal?.nature || ""}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${journal?.remarks || ""}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${formatNumber(journal.amount)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      ]);
    });

    journalVouchers.push([
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `Bank Sub Total: `, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${formatNumber(totalPerBank)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    ]);

    journalVouchers.push(Array.from({ length: 6 }, () => ({ v: ``, t: "s", s: { alignment: { vertical: "center" } } })));
  });

  journalVouchers.push([
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: `${formatNumber(totalAmount)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(journalVouchers, { origin: "A7" });

  worksheet["!cols"] = Array.from(Array(14)).fill({ wch: 20 });

  let title = "";

  const headerTitle = "KAALALAY FOUNDATION, INC. (LB)";
  const headerSubtitle = `Journal Vouchers By Banks`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [title], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Journal Vouchers");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  return excelBuffer;
};
