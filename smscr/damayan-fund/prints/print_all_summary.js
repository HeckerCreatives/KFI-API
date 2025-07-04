const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");

exports.damayanFundSummaryPrintAll = (datas, from = "", to = "") => {
  const info = {
    title: "Damayan Fund",
  };

  const loanReleases = [];
  let total = 0;

  datas.map((data, i) => {
    total += data.amount;
    loanReleases.push([
      { text: `JV#${data.code}`, fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: completeNumberDate(data.date), fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: data.supplier.description, fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: data.remarks, fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: data.bankCode.description, fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: data.checkNo, fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: completeNumberDate(data.checkDate), fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: formatNumber(data.amount), fontSize: 10, alignment: "right", margin: [0, 1, 0, 1], border: [0, 0, 0, i + 1 === datas.length ? 1 : 0] },
    ]);
  });

  let title = "";
  if (from && !to) title = `Doc. No. From JV#${from}`;
  if (to && !from) title = `Doc. No. To JV#${to}`;
  if (to && from) title = `Doc. No. From JV#${from} To JV#${to}`;

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "Damayan Fund By Doc. No. (Summarized)", fontSize: 9 },
    { text: title, fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["*", "*", "*", "*", "*", "*", "*", "*"],
        body: [
          [
            { text: "Doc. No.", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
            { text: "Date", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
            { text: "Supplier", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
            { text: "Particular", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
            { text: "Bank", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
            { text: "Check No.", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
            { text: "Check Date", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
            { text: "Amount", fontSize: 10, alignment: "right", bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
          ],
          ...loanReleases,
          [{ text: "", border: [0, 0, 0, 0], colSpan: 7 }, {}, {}, {}, {}, {}, {}, { text: formatNumber(total), alignment: "right", fontSize: 10, border: [0, 0, 0, 1] }],
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
    pageMargins: [20, 25, 20, 25],
    content: contents,
    styles: styles,
    defaultStyle: {
      font: "Roboto",
    },
  };
};
