const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");

exports.releaseSummaryPrintAll = (datas, from = "", to = "") => {
  const info = {
    title: "Acknowledgement",
  };

  const loanReleases = [];
  let total = 0;

  datas.map((data, i) => {
    total += data.amount;
    loanReleases.push([
      { text: `${data.code}`, fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: completeNumberDate(data.date), fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: data.remarks, fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: data.bankCode.description, fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: data.checkNo, fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: completeNumberDate(data.checkDate), fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: formatNumber(data.amount), fontSize: 10, alignment: "right", margin: [0, 1, 0, 1], border: [0, 0, 0, i + 1 === datas.length ? 1 : 0] },
    ]);
  });

  let title = "";
  if (from && !to) title = `Doc. No. From ${from}`;
  if (to && !from) title = `Doc. No. To ${to}`;
  if (to && from) title = `Doc. No. From ${from} To ${to}`;

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "Acknowledgement By Doc. No. (Summarized)", fontSize: 9 },
    { text: title, fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["10%", "10%", "20%", "20%", "20%", "10%", "10%"],
        body: [
          [
            { text: "Doc. No.", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
            { text: "Date", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
            { text: "Particular", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
            { text: "Bank", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
            { text: "Check No.", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
            { text: "Check Date", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
            { text: "Amount", fontSize: 10, alignment: "right", bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
          ],
          ...loanReleases,
          [{ text: "", border: [0, 0, 0, 0], colSpan: 6 }, {}, {}, {}, {}, {}, { text: formatNumber(total), alignment: "right", fontSize: 10, border: [0, 0, 0, 1] }],
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
