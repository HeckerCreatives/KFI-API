const { DateTime } = require("luxon");
const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");
const XLSX = require("xlsx-js-style");

const getPaymentOverdues = (ars, lastPaymentDue) => {
  const totals = { d30: 0, d60: 0, d90: 0, d120: 0, d180: 0, d360: 0, over1Year: 0 };

  const maturityDate = DateTime.fromISO(lastPaymentDue?.date);
  if (!maturityDate.isValid) return totals;

  ars.forEach(obj => {
    if (["2000A"].includes(obj.acctCode?.code)) {
      const paymentDate = DateTime.fromISO(obj.createdAt).startOf("day");
      const diffInDays = Math.floor(paymentDate.diff(maturityDate, "days").days);

      if (diffInDays >= 1 && diffInDays <= 30) totals.d30 += Number(obj.debit || 0);
      else if (diffInDays <= 60) totals.d60 += Number(obj.debit || 0);
      else if (diffInDays <= 90) totals.d90 += Number(obj.debit || 0);
      else if (diffInDays <= 120) totals.d120 += Number(obj.debit || 0);
      else if (diffInDays <= 180) totals.d180 += Number(obj.debit || 0);
      else if (diffInDays <= 360) totals.d360 += Number(obj.debit || 0);
      else if (diffInDays >= 361) totals.over1Year += Number(obj.debit || 0);
    }
  });

  return totals;
};

const getPayment = ars => {
  return ars.reduce((acc, obj) => {
    if (["2000A"].includes(obj.acctCode.code)) return acc + Number(obj.debit);
    return acc;
  }, 0);
};

const getDamayanFund = ars => {
  return ars.reduce((acc, obj) => {
    if (obj.acctCode.code === "2010D") return acc + Number(obj.debit);
    return acc;
  }, 0);
};

// START EME
exports.exportPastDuesExcel = (datas, loanCodes, from = "", to = "") => {
  let topBottomBorder = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "none" }, right: { style: "none" } };

  const pastDues = [];
  let totals = { principal: 0, payment: 0, balance: 0, current: 0, d30: 0, d60: 0, d90: 0, d120: 0, d180: 0, d360: 0, over1Year: 0, df: 0 };

  const loanCodeTotals = loanCodes.reduce((acc, lc) => {
    acc[lc.code] = { principal: 0, payment: 0, balance: 0, current: 0 };
    return acc;
  }, {});

  pastDues.push([
    { v: "Ctr #", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Center", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Client", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Loan Type", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Mat. Date", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Principal", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "Payment", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "Balance", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "Current", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "1-30D", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "31-60D", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "61-90D", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "91-120D", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "121-180D", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "181-360D", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "Over 1 Yr", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "DF", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  datas.map(data => {
    loanCodeTotals[data?.transaction?.loan?.code].principal += Number(data?.currentLoan?.debit);
    totals.principal += Number(data?.currentLoan?.debit);

    const payment = getPayment(data.ars);
    loanCodeTotals[data?.transaction?.loan?.code].payment += Number(payment);
    totals.payment += Number(payment);

    const balance = Number(data?.currentLoan?.debit) - payment;
    loanCodeTotals[data?.transaction?.loan?.code].balance += Number(balance);
    totals.balance += Number(balance);

    const current = Number(data?.currentLoan?.debit) - payment;
    loanCodeTotals[data?.transaction?.loan?.code].current += Number(current);
    totals.current += Number(current);

    const overdues = getPaymentOverdues(data?.ars, data?.lastPaymentDue);
    totals.d30 += overdues.d30;
    totals.d60 += overdues.d60;
    totals.d90 += overdues.d90;
    totals.d120 += overdues.d120;
    totals.d180 += overdues.d180;
    totals.d360 += overdues.d360;
    totals.over1Year += overdues.over1Year;

    const damayanFund = getDamayanFund(data?.ars);
    totals.df += Number(damayanFund);

    pastDues.push([
      { v: `${data?.client?.center?.centerNo || ""}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: `${data?.client?.center?.description || ""}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: `${data?.client?.name || ""}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: `${data?.transaction?.loan?.code}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: `${completeNumberDate(data?.lastPaymentDue?.date)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: `${formatNumber(data?.currentLoan?.debit)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${formatNumber(payment)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${formatNumber(balance)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${formatNumber(current)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${formatNumber(overdues.d30)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${formatNumber(overdues.d60)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${formatNumber(overdues.d90)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${formatNumber(overdues.d120)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${formatNumber(overdues.d180)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${formatNumber(overdues.d360)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${formatNumber(overdues.over1Year)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${formatNumber(damayanFund)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
    ]);
  });

  pastDues.push([]);

  pastDues.push([
    { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
    { v: `${formatNumber(totals.principal)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totals.payment)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totals.balance)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totals.current)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totals.d30)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totals.d60)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totals.d90)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totals.d120)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totals.d180)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totals.d360)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totals.over1Year)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totals.df)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  pastDues.push([]);

  pastDues.push([
    { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
    { v: `Grand Total: `, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
    { v: `${formatNumber(totals.principal)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totals.payment)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totals.balance)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totals.current)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totals.d30)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totals.d60)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totals.d90)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totals.d120)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totals.d180)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totals.d360)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totals.over1Year)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totals.df)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  pastDues.push([], []);

  Object.keys(loanCodeTotals).forEach(key => {
    pastDues.push([
      { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: `${key}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
      {
        v: `${loanCodeTotals[key].payment === 0 ? "" : formatNumber(loanCodeTotals[key].payment)}`,
        t: "s",
        s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } },
      },
      {
        v: `${loanCodeTotals[key].balance === 0 ? "" : formatNumber(loanCodeTotals[key].balance)}`,
        t: "s",
        s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } },
      },
      {
        v: `${loanCodeTotals[key].current === 0 ? "" : formatNumber(loanCodeTotals[key].current)}`,
        t: "s",
        s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } },
      },
      { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
      { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
      { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
      { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
      { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
      { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
      { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
      { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
    ]);
  });

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(pastDues, { origin: "A7" });

  worksheet["!cols"] = Array.from(Array(14)).fill({ wch: 20 });

  let title = "";

  const headerTitle = "KAALALAY FOUNDATION, INC. (LB)";
  const headerSubtitle = `Loan Release Past Dues`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [title], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Loan Release");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  return excelBuffer;
};
