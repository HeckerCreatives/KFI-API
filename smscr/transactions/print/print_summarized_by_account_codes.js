const { bankCodes } = require("../../../constants/bank-codes");
const { loanCodes } = require("../../../constants/loan-codes");
const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");

exports.lrPrintSummarizedByAccounts = (datas, from = "", to = "") => {
  const info = { title: "Loan Release" };

  const loanReleases = [];

  let totalDebit = 0;
  let totalCredit = 0;

  datas.map(data => {
    let debit = data.entries.reduce((acc, obj) => (acc += Number(obj?.debit || 0)), 0);
    let credit = data.entries.reduce((acc, obj) => (acc += Number(obj?.credit || 0)), 0);
    loanReleases.push([
      { text: `${data.code}`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: `${data.description}`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: `${formatNumber(debit)}`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 0], alignment: "right" },
      { text: `${formatNumber(credit)}`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 0], alignment: "right" },
    ]);
    totalDebit += debit;
    totalCredit += credit;
  });
  loanReleases.push([...Array.from({ length: 4 }, () => ({ text: ``, fontSize: 8, margin: [0, 5, 0, 5], border: [0, 0, 0, 0] }))]);
  loanReleases.push([
    { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: `Grand Total: `, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
    { text: `${formatNumber(totalDebit)}`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalCredit)}`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
  ]);

  let title = "";
  if (from && !to) title = `Period Covered: From ${completeNumberDate(from)}`;
  if (to && !from) title = `Period Covered: To ${completeNumberDate(to)}`;
  if (to && from) title = `Period Covered: From ${completeNumberDate(from)} To ${completeNumberDate(to)}`;

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "Loan Release By Account ( Sort By Client )", fontSize: 9 },
    { text: title, fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["20%", "50%", "15%", "15%"],
        body: [
          [
            { text: "Acct. Code", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Description", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Debit", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Credit", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
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
    pageOrientation: "portrait",
    footer: footer,
    pageMargins: [10, 25, 10, 30],
    content: contents,
    styles: styles,
    defaultStyle: {
      font: "Roboto",
    },
  };
};
