const { DateTime } = require("luxon");
const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");
const { truncate } = require("../../../utils/string.utils");

const getPaymentOverdues = (ars, lastPaymentDue) => {
  const totals = { d30: 0, d60: 0, d90: 0, d120: 0, d180: 0, d360: 0, over1Year: 0 };

  const maturityDate = DateTime.fromISO(lastPaymentDue?.date);
  if (!maturityDate.isValid) return totals;

  ars.forEach((obj) => {
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

const getPayment = (ars) => {
  return ars.reduce((acc, obj) => {
    if (["2000A"].includes(obj.acctCode.code)) return acc + Number(obj.debit);
    return acc;
  }, 0);
};

const getDamayanFund = (ars) => {
  return ars.reduce((acc, obj) => {
    if (obj.acctCode.code === "2010D") return acc + Number(obj.debit);
    return acc;
  }, 0);
};

exports.printPastDuesPDF = (datas, loanCodes, from = "", to = "") => {
  const info = { title: "Past Dues" };

  const pastDues = [];
  let totals = { principal: 0, payment: 0, balance: 0, current: 0, d30: 0, d60: 0, d90: 0, d120: 0, d180: 0, d360: 0, over1Year: 0, df: 0 };
  let fontSize = 9;

  const loanCodeTotals = loanCodes.reduce((acc, lc) => {
    acc[lc.code] = { principal: 0, payment: 0, balance: 0, current: 0 };
    return acc;
  }, {});

  datas.map((data) => {
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
      { text: `${truncate(data?.client?.center?.centerNo || "", 7)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: `${truncate(data?.client?.center?.description || "", 7)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: `${data?.client?.name || ""}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: `${data?.transaction?.loan?.code}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: `${completeNumberDate(data?.lastPaymentDue?.date)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: `${formatNumber(data?.currentLoan?.debit)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
      { text: `${formatNumber(payment)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
      { text: `${formatNumber(balance)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
      { text: `${formatNumber(current)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
      { text: `${formatNumber(overdues.d30)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
      { text: `${formatNumber(overdues.d60)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
      { text: `${formatNumber(overdues.d90)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
      { text: `${formatNumber(overdues.d120)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
      { text: `${formatNumber(overdues.d180)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
      { text: `${formatNumber(overdues.d360)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
      { text: `${formatNumber(overdues.over1Year)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
      { text: `${formatNumber(damayanFund)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
    ]);
  });

  pastDues.push(Array.from({ length: 17 }, () => ({ text: "", border: [0, 0, 0, 0] })));

  pastDues.push([
    { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: `${formatNumber(totals.principal)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totals.payment)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totals.balance)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totals.current)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totals.d30)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totals.d60)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totals.d90)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totals.d120)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totals.d180)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totals.d360)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totals.over1Year)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totals.df)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
  ]);

  pastDues.push(Array.from({ length: 17 }, () => ({ text: "", border: [0, 0, 0, 0] })));

  pastDues.push([
    { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: `Grand Total:`, colSpan: 2, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: `${formatNumber(totals.principal)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totals.payment)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totals.balance)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totals.current)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totals.d30)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totals.d60)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totals.d90)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totals.d120)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totals.d180)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totals.d360)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totals.over1Year)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totals.df)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
  ]);

  pastDues.push(Array.from({ length: 17 }, () => ({ text: "", border: [0, 0, 0, 0] })));
  pastDues.push(Array.from({ length: 17 }, () => ({ text: "", border: [0, 0, 0, 0] })));

  Object.keys(loanCodeTotals).forEach((key) => {
    pastDues.push([
      { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: `${key}`, colSpan: 2, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      {
        text: `${loanCodeTotals[key].principal === 0 ? "" : formatNumber(loanCodeTotals[key].principal)}`,
        fontSize,
        margin: [0, 0, 0, 0],
        border: [0, 0, 0, 0],
        alignment: "right",
      },
      { text: `${loanCodeTotals[key].payment === 0 ? "" : formatNumber(loanCodeTotals[key].payment)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
      { text: `${loanCodeTotals[key].balance === 0 ? "" : formatNumber(loanCodeTotals[key].balance)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
      { text: `${loanCodeTotals[key].current === 0 ? "" : formatNumber(loanCodeTotals[key].current)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
      { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    ]);
  });

  let title = "";
  if (from && !to) title = `Date Period From ${from}`;
  if (to && !from) title = `Date Period To ${to}`;
  if (to && from) title = `Date Period From ${from} To ${to}`;

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "Loan Receivable", fontSize: 9 },
    { text: title, fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["5.5%", "5.5%", "10%", "5.5%", "6%", "5.5%", "5.5%", "5.5%", "5.5%", "5.5%", "5.5%", "5.5%", "5.5%", "5.5%", "5.5%", "5.5%", "5.5%", "5.5%"],
        body: [
          [
            { text: "Ctr #", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1] },
            { text: "Center", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1] },
            { text: "Client", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1] },
            { text: "Loan Type", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1] },
            { text: "Mat. Date", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1] },
            { text: "Principal", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Payment", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Balance", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Current", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1], alignment: "right" },
            { text: "1-30D", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1], alignment: "right" },
            { text: "31-60D", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1], alignment: "right" },
            { text: "61-90D", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1], alignment: "right" },
            { text: "91-120D", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1], alignment: "right" },
            { text: "121-180D", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1], alignment: "right" },
            { text: "181-360D", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Over 1 Yr", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1], alignment: "right" },
            { text: "DF", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1], alignment: "right" },
          ],
          ...pastDues,
        ],
      },
    },
  ];

  const styles = [];

  const footer = function (currentPage, pageCount) {
    return {
      text: `Page ${currentPage} of ${pageCount}`,
      alignment: "right",
      fontSize: 8,
      margin: [0, 5, 20, 0],
    };
  };

  return {
    info: info,
    pageOrientation: "landscape",
    pageSize: "legal",
    footer: footer,
    pageMargins: [20, 25, 20, 25],
    content: contents,
    styles: styles,
    defaultStyle: {
      font: "Roboto",
    },
  };
};
