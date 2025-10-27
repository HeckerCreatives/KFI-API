const { loanCodes } = require("../../../constants/loan-codes");
const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");
const XLSX = require("xlsx-js-style");

exports.relExportByDateByAccountOfficer = (datas, from, to) => {
  const rows = [];
  let totalPrincipal = 0;
  let totalInterest = 0;
  let totalWSF = 0;
  let totalDamayan = 0;
  let totalCGT = 0;
  let totalEmergency = 0;

  let topBottomBorder = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "none" }, right: { style: "none" } };

  rows.push([
    { v: "Date", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Doc. No.", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Center", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Bank", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Principal", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "Interest", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "WSF", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "Damayan", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "CGT", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "Emergency", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  datas.map(release => {
    rows.push([{ v: `${release._id}`, t: "s", s: { alignment: { vertical: "center" } } }]);

    let officerTotalPrincipal = 0;
    let officerTotalInterest = 0;
    let officerTotalWSF = 0;
    let officerTotalDamayan = 0;
    let officerTotalCGT = 0;
    let officerTotalEmergency = 0;

    release.releases.map(data => {
      const principal = data.entries.reduce((acc, entry) => {
        if (loanCodes.includes(entry.acctCode.code)) acc += Number(entry?.debit || 0);
        return acc;
      }, 0);
      totalPrincipal += principal;
      officerTotalPrincipal += principal;

      const interest = data.entries.reduce((acc, entry) => {
        if (entry.acctCode.code === "4045") acc += Number(entry?.debit || 0);
        return acc;
      }, 0);
      totalInterest += interest;
      officerTotalInterest += interest;

      const wsf = data.entries.reduce((acc, entry) => {
        if (entry.acctCode.code === "2010C") acc += Number(entry?.debit || 0);
        return acc;
      }, 0);
      totalWSF += wsf;
      officerTotalWSF += wsf;

      const damayan = data.entries.reduce((acc, entry) => {
        if (entry.acctCode.code === "2010D") acc += Number(entry?.debit || 0);
        return acc;
      }, 0);
      totalDamayan += damayan;
      officerTotalDamayan += damayan;

      rows.push([
        { v: `${completeNumberDate(data.date)}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${data.code}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${data.center.centerNo} - ${data.center.description}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${data.bankCode.code}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${formatNumber(principal)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: `${formatNumber(interest)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: `${formatNumber(wsf)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: `${formatNumber(damayan)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: `${formatNumber(0)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: `${formatNumber(0)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      ]);
    });

    rows.push([
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${formatNumber(officerTotalPrincipal)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
      { v: `${formatNumber(officerTotalInterest)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
      { v: `${formatNumber(officerTotalWSF)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
      { v: `${formatNumber(totalDamayan)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
      { v: `${formatNumber(officerTotalCGT)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
      { v: `${formatNumber(officerTotalEmergency)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    ]);
  });

  rows.push([{ v: ``, t: "s", s: { alignment: { vertical: "center" } } }]);

  rows.push([
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${formatNumber(totalPrincipal)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalInterest)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalWSF)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalDamayan)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalCGT)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalEmergency)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows, { origin: "A7" });

  worksheet["!cols"] = Array.from(Array(14)).fill({ wch: 20 });

  let title = "";
  if (from && !to) title = `Period Covered: From ${from}`;
  if (to && !from) title = `Period Covered: To ${to}`;
  if (to && from) title = `Period Covered: From ${from} To ${to}`;

  const headerTitle = "KAALALAY FOUNDATION, INC. (LB)";
  const headerSubtitle = `Acknowledgement Receipt By Date ( Account Officer )`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [title], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Acknowledgement Receipt");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  return excelBuffer;
};
