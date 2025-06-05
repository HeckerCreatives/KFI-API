const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");

exports.generateWeeklySavingsPDF = datas => {
  const info = {
    title: "Weekly Savings Table",
  };

  const weeklySavings = datas.map(data => [
    { text: formatNumber(data.rangeAmountFrom), fontSize: 8, margin: [0, 1, 0, 1] },
    { text: formatNumber(data.rangeAmountTo), fontSize: 8, margin: [0, 1, 0, 1] },
    { text: formatNumber(data.weeklySavingsFund), fontSize: 8, margin: [0, 1, 0, 1] },
  ]);

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "Weekly Savings Table", fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["33.33%", "33.33%", "33.33%"],
        body: [
          [
            { text: "Range Amount From", fontSize: 9, bold: true },
            { text: "Range Amount To", fontSize: 9, bold: true },
            { text: "Weekly Savings Fund", fontSize: 9, bold: true },
          ],
          ...weeklySavings,
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
    footer: footer,
    pageMargins: [20, 25, 20, 25],
    content: contents,
    styles: styles,
    defaultStyle: {
      font: "Roboto",
    },
  };
};
