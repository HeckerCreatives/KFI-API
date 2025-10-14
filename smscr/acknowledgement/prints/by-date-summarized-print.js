const { completeNumberDate } = require("../../../utils/date");

exports.ackPrintByDateSummarized = (datas, from = "", to = "") => {
  const info = { title: "Official Receipt" };

  const rows = [];

  datas.map(data => {
    rows.push([
      { text: `${completeNumberDate(data.date)}`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: `${data.code}`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: `${data.center.centerNo} - ${data.center.description}`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    ]);
  });

  let title = "";
  if (from && !to) title = `Date From ${completeNumberDate(from)}`;
  if (to && !from) title = `Date To ${completeNumberDate(to)}`;
  if (to && from) title = `Date From ${completeNumberDate(from)} To ${completeNumberDate(to)}`;

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "Official Receipt By Date ( Summarized )", fontSize: 9 },
    { text: title, fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["20%", "20%", "60%"],
        body: [
          [
            { text: "Date", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Doc. No.", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Center", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
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
