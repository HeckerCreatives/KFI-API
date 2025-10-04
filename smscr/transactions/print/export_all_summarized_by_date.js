const { bankCodes } = require("../../../constants/bank-codes");
const { loanCodes } = require("../../../constants/loan-codes");
const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");
const XLSX = require("xlsx-js-style");

exports.exportSummarizedByDate = (transactions, from, to) => {
  const formattedLoanReleases = [];
  const formattedDatas = [];

  transactions.map((data, i) => {
    data.principal = data.entries.reduce((acc, entry) => {
      if (loanCodes.includes(entry.acctCode.code)) acc += Number(entry?.debit || 0);
      return acc;
    }, 0);

    data.misc = data.entries.reduce((acc, entry) => {
      let code = entry.acctCode.code;
      if (!loanCodes.includes(code) && !bankCodes.includes(code)) acc += Number(entry?.credit || 0);
      return acc;
    }, 0);

    const fData = formattedDatas.findIndex(e => e.officer === data.acctOfficer);
    const monthYear = `${new Date(data.date).getMonth()} - ${new Date(data.date).getFullYear()}`;
    if (fData < 0) {
      formattedDatas.push({ officer: data.acctOfficer, months: [{ month: monthYear, datas: [data] }] });
    } else {
      const my = formattedDatas[fData].months.findIndex(e => e.month === monthYear);
      if (my < 0) formattedDatas[fData].months.push({ month: monthYear, datas: [data] });
      if (my >= 0) formattedDatas[fData].months[my].datas.push(data);
    }
  });

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

  formattedDatas.map(officer => {
    formattedLoanReleases.push([
      { v: `${officer.officer.toUpperCase()}`, t: "s", s: { alignment: { vertical: "center" } } },
      ...Array.from({ length: 13 }, () => ({ v: ``, t: "s", s: { alignment: { vertical: "center" } } })),
    ]);

    let oAmount = 0;
    let oMisc = 0;
    let oPrincipal = 0;

    officer.months.map(month => {
      let tAmount = 0;
      let tMisc = 0;
      let tPrincipal = 0;

      month.datas.map(data => {
        tAmount += Number(data.amount);
        tPrincipal += data.principal;
        tMisc += data.misc;

        formattedLoanReleases.push([
          { v: `${completeNumberDate(data.date)}`, t: "s", s: { alignment: { vertical: "center" } } },
          { v: `${data.code}`, t: "s", s: { alignment: { vertical: "center" } } },
          { v: `${data.center.centerNo} - ${data.center.description}`, t: "s", s: { alignment: { vertical: "center" } } },
          { v: `${data.bank.description}`, t: "s", s: { alignment: { vertical: "center" } } },
          { v: `${data?.checkNo || ""}`, t: "s", s: { alignment: { vertical: "center" } } },
          { v: `${completeNumberDate(data.checkDate)}`, t: "s", s: { alignment: { vertical: "center" } } },
          { v: `${formatNumber(data.principal)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
          { v: `0.00`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
          { v: `0.00`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
          { v: `0.00`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
          { v: `0.00`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
          { v: `0.00`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
          { v: `${formatNumber(data.misc)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
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
      formattedLoanReleases.push([...Array.from({ length: 14 }, () => ({ v: ``, t: "s", s: { alignment: { vertical: "center" } } }))]);

      oAmount += tAmount;
      oMisc += tMisc;
      oPrincipal += tPrincipal;
    });

    formattedLoanReleases.push([
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${formatNumber(oPrincipal)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
      { v: `0.00`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
      { v: `0.00`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
      { v: `0.00`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
      { v: `0.00`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
      { v: `0.00`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
      { v: `${formatNumber(oMisc)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
      { v: `${formatNumber(oAmount)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    ]);
    formattedLoanReleases.push([...Array.from({ length: 14 }, () => ({ v: ``, t: "s", s: { alignment: { vertical: "center" } } }))]);
    totalAmount += oAmount;
    totalMisc += oMisc;
    totalPrincipal += oPrincipal;
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
