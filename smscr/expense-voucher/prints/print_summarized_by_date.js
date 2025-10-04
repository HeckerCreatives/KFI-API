const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");

exports.evPrintSummarizedByDate = (datas, from = "", to = "") => {
  const info = {
    title: "Expense Voucher",
  };

  const expenseVouchers = [];
  let totalAmount = 0;
  let fontSize = 9;

  datas.map(data => {
    let totalPerDate = 0;
    data.expenses.map(journal => {
      totalPerDate += Number(journal.amount);
      expenseVouchers.push([
        { text: `${completeNumberDate(journal.date)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: `${journal.code}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: `${journal?.supplier || ""}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: `${journal?.remarks || ""}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: `${journal?.bank?.code || ""}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: `${journal?.checkNo || ""}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: `${completeNumberDate(journal?.checkDate)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: formatNumber(journal.amount), fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
      ]);
    });
    totalAmount += totalPerDate;
    expenseVouchers.push(
      [
        { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: formatNumber(totalPerDate), fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
      ],
      Array.from({ length: 8 }, () => ({ text: ``, fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] }))
    );
  });

  expenseVouchers.push([
    { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: formatNumber(totalAmount), fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
  ]);

  let title = "";
  if (from && !to) title = `Date Period From ${from}`;
  if (to && !from) title = `Date Period To ${to}`;
  if (to && from) title = `Date Period From ${from} To ${to}`;

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "Expense Voucher By Date ( Summarized )", fontSize: 9 },
    { text: title, fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["7%", "10%", "20%", "20%", "16%", "10%", "7%", "10%"],
        body: [
          [
            { text: "Date", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1] },
            { text: "Doc. No.", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1] },
            { text: "Supplier", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1] },
            { text: "Particular", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1] },
            { text: "Bank", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1] },
            { text: "Check No.", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1] },
            { text: "Check Date", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1] },
            { text: "Amount", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1], alignment: "right" },
          ],
          ...expenseVouchers,
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
