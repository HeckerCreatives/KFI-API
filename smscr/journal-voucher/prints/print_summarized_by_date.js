const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");

exports.jvPrintSummarizedByDate = (datas, from = "", to = "") => {
  const info = {
    title: "Journal Voucher",
  };

  const journalVouchers = [];
  let totalAmount = 0;
  let fontSize = 9;

  datas.map(data => {
    let totalPerDate = 0;
    data.journals.map(journal => {
      totalPerDate += Number(journal.amount);
      journalVouchers.push([
        { text: `${completeNumberDate(journal.date)}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: `${journal.code}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: `${journal?.nature || ""}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: `${journal?.remarks || ""}`, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: formatNumber(journal.amount), fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
      ]);
    });
    totalAmount += totalPerDate;
    journalVouchers.push(
      [
        { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: ``, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: formatNumber(totalPerDate), fontSize, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
      ],
      Array.from({ length: 5 }, () => ({ text: ``, fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] }))
    );
  });

  journalVouchers.push([
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
    { text: "Journal Voucher By Date ( Summarized )", fontSize: 9 },
    { text: title, fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["15%", "15%", "27.5%", "27.5%", "15%"],
        body: [
          [
            { text: "Date", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1] },
            { text: "Doc. No.", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1] },
            { text: "Nature", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1] },
            { text: "Particular", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1] },
            { text: "Amount", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1], alignment: "right" },
          ],
          ...journalVouchers,
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
