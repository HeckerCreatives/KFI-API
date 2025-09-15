const { bankCodes } = require("../../../constants/bank-codes");
const { loanCodes } = require("../../../constants/loan-codes");
const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");

exports.loanReleaseDetailedByDate = (datas, from = "", to = "") => {
  const info = {
    title: "Loan Release",
  };

  const loanReleases = [];

  let totalAmount = 0;
  let totalMisc = 0;
  let totalPrincipal = 0;

  datas.map(data => {
    console.log(data.entries);
    totalAmount += Number(data.amount);

    const principal = data.entries.reduce((acc, entry) => {
      if (loanCodes.includes(entry.acctCode.code)) acc += Number(entry?.debit || 0);
    }, 0);
    totalPrincipal += principal;

    const misc = data.entries.reduce((acc, entry) => {
      let code = entry.acctCode.code;
      if (!loanCodes.includes(code) && !bankCodes.includes(code)) acc += Number(entry?.credit || 0);
    }, 0);
    totalMisc += misc;

    loanReleases.push([
      { text: completeNumberDate(data.date), fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: `${data?.code}`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: `${data.center.centerNo} - ${data.center.description}`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: data.bank.description, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: data.checkNo, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: completeNumberDate(data.checkDate), fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: formatNumber(principal), fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
      { text: `0.00`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
      { text: `0.00`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
      { text: `0.00`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
      { text: `0.00`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
      { text: `0.00`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
      { text: formatNumber(misc), fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
      { text: formatNumber(data.amount), fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
    ]);
  });

  loanReleases.push([
    { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },
    { text: `0.00`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },
    { text: `0.00`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },
    { text: `0.00`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },
    { text: `0.00`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },
    { text: `0.00`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },
    { text: ``, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalAmount)}`, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },
  ]);

  let title = "";
  if (from && !to) title = `Date From ${completeNumberDate(from)}`;
  if (to && !from) title = `Date To ${completeNumberDate(to)}`;
  if (to && from) title = `Date From ${completeNumberDate(from)} To ${completeNumberDate(to)}`;

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "Loan Release By Date (Detailed)", fontSize: 9 },
    { text: title, fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["7%", "10%", "10%", "10%", "7%", "7%", "7%", "5%", "5%", "6%", "5%", "6.5%", "7%", "7%"],
        body: [
          [
            { text: "Date", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "center" },
            { text: "Doc. No.", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "center" },
            { text: "Center", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "center" },
            { text: "Bank", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "center" },
            { text: "Check No.", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "center" },
            { text: "Check Date", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "center" },
            { text: "Principal", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Interest", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "WSF", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Damayan", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "CGT", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Emergency", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Misc", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Amount", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
          ],
          ...loanReleases,
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
    footer: footer,
    pageMargins: [10, 25, 10, 25],
    content: contents,
    styles: styles,
    defaultStyle: {
      font: "Roboto",
    },
  };
};
