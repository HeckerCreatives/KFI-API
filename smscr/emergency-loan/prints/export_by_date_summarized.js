const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");
const XLSX = require("xlsx-js-style");

exports.exportELSummarizedByDate = (emergencyLoans, from, to) => {
  const emergencies = [];

  let totalAmount = 0;

  let topBottomBorder = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "none" }, right: { style: "none" } };

  emergencies.push([
    { v: "Date", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Doc. No.", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Supplier", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Particulars", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Bank", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Check No.", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Check Date", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Amount", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  emergencyLoans.map(data => {
    let totalPerDate = 0;
    data.emergencies.map(emergency => {
      totalPerDate += Number(emergency.amount);
      emergencies.push([
        { v: `${completeNumberDate(emergency.date)}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${emergency?.code}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${emergency?.supplier || ""}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${emergency?.remarks || ""}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${emergency?.bank.code || ""}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${emergency?.checkNo || ""}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${completeNumberDate(emergency?.checkDate)}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${formatNumber(emergency.amount)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      ]);
    });
    totalAmount += Number(totalPerDate);
    emergencies.push(
      [
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${formatNumber(totalPerDate)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
      ],
      Array.from({ length: 8 }, () => ({ v: ``, t: "s", s: { alignment: { vertical: "center" } } }))
    );
  });

  emergencies.push([
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${formatNumber(totalAmount)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(emergencies, { origin: "A7" });

  worksheet["!cols"] = Array.from(Array(14)).fill({ wch: 20 });

  let title = "";
  if (from && !to) title = `Period Covered: From ${completeNumberDate(from)}`;
  if (to && !from) title = `Period Covered: To ${completeNumberDate(to)}`;
  if (to && from) title = `Period Covered: From ${completeNumberDate(from)} To ${completeNumberDate(to)}`;

  const headerTitle = "KAALALAY FOUNDATION, INC. (LB)";
  const headerSubtitle = `Emergency Loan By Date ( Detailed )`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [title], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Emergency Loan");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  return excelBuffer;
};
