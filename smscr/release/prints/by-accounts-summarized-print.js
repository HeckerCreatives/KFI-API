const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");

exports.relPrintByAccountsSummarized = (datas, from = "", to = "") => {
  const info = { title: "Acknowledgement Receipt" };

  const rows = [];

  let totalDebit = 0;
  let totalCredit = 0;

  datas.map(data => {
    const credit = data.entries.reduce((acc, obj) => (acc += Number(obj?.credit || 0)), 0);
    const debit = data.entries.reduce((acc, obj) => (acc += Number(obj?.debit || 0)), 0);

    totalCredit += credit;
    totalDebit += debit;

    rows.push([
      { text: `${data.code}`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: `${data.description}`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: `${formatNumber(debit)}`, alignment: "right", fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: `${formatNumber(credit)}`, alignment: "right", fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    ]);
  });

  rows.push(Array.from({ length: 4 }, () => ({ text: ``, fontSize: 8, margin: [0, 2, 0, 2], border: [0, 0, 0, 0] })));

  rows.push([
    { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    { text: `Grand Total: `, alignment: "right", fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    { text: `${formatNumber(totalDebit)}`, alignment: "right", fontSize: 8, margin: [0, 1, 0, 1], border: [0, 1, 0, 1] },
    { text: `${formatNumber(totalCredit)}`, alignment: "right", fontSize: 8, margin: [0, 1, 0, 1], border: [0, 1, 0, 1] },
  ]);

  let title = "";
  if (from && !to) title = `Date From ${completeNumberDate(from)}`;
  if (to && !from) title = `Date To ${completeNumberDate(to)}`;
  if (to && from) title = `Date From ${completeNumberDate(from)} To ${completeNumberDate(to)}`;

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "Acknowledgement Receipt By Account Code ( Summarized )", fontSize: 9 },
    { text: title, fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["30%", "30%", "20%", "20%"],
        body: [
          [
            { text: "Acct Code", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Description", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Debit", alignment: "right", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Credit", alignment: "right", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
          ],
          ...rows,
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
    pageMargins: [10, 25, 10, 25],
    content: contents,
    styles: styles,
    defaultStyle: {
      font: "Roboto",
    },
  };
};
