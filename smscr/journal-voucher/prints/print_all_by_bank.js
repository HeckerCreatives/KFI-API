const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");

exports.jvPrintByBank = datas => {
  const info = {
    title: "Journal Voucher",
  };

  const journalVouchers = [];
  let total = 0;

  datas.map((data, i) => {
    journalVouchers.push([
      { text: `Bank: `, fontSize: 9, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], bold: true },
      { text: `${data.code} - ${data.description}`, colSpan: 3, fontSize: 9, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], bold: true },
      {},
      {},
      { text: ``, fontSize: 9, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: ``, fontSize: 9, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    ]);

    let totalPerBank = 0;

    data.journals.map(journal => {
      total += Number(journal.amount);
      totalPerBank += Number(journal.amount);

      journalVouchers.push([
        { text: completeNumberDate(journal.checkDate), fontSize: 9, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: `${journal?.checkNo || ""}`, fontSize: 9, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: `${journal.code}`, fontSize: 9, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: `${journal?.nature || ""}`, fontSize: 9, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: `${journal?.remarks || ""}`, fontSize: 9, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: `${formatNumber(journal.amount)}`, fontSize: 9, alignment: "right", margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      ]);
    });

    journalVouchers.push([
      { text: "Bank Sub Total: ", border: [0, 0, 0, 0], margin: [0, 0, 10, 0], fontSize: 9, colSpan: 5, alignment: "right" },
      {},
      {},
      {},
      {},
      { text: formatNumber(totalPerBank), alignment: "right", fontSize: 9, border: [0, 1, 0, 1] },
    ]);

    journalVouchers.push(Array.from({ length: 6 }, () => ({ text: ``, fontSize: 9, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] })));
  });

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "Journal Vouchers By Banks", fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["15%", "15%", "15%", "20%", "20%", "15%"],
        body: [
          [
            { text: "Check Date", fontSize: 9, bold: true, margin: [0, 4, 0, 4], border: [0, 1, 0, 1] },
            { text: "Check No", fontSize: 9, bold: true, margin: [0, 4, 0, 4], border: [0, 1, 0, 1] },
            { text: "Doc No", fontSize: 9, bold: true, margin: [0, 4, 0, 4], border: [0, 1, 0, 1] },
            { text: "Nature", fontSize: 9, bold: true, margin: [0, 4, 0, 4], border: [0, 1, 0, 1] },
            { text: "Particulars", fontSize: 9, bold: true, margin: [0, 4, 0, 4], border: [0, 1, 0, 1] },
            { text: "Amount", fontSize: 9, alignment: "right", bold: true, margin: [0, 4, 0, 4], border: [0, 1, 0, 1] },
          ],
          ...journalVouchers,
          Array.from({ length: 6 }, () => ({ text: ``, fontSize: 9, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] })),
          [{ text: "", border: [0, 0, 0, 0], colSpan: 5 }, {}, {}, {}, {}, { text: formatNumber(total), alignment: "right", fontSize: 9, border: [0, 1, 0, 1] }],
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
    pageSize: "LEGAL",
    footer: footer,
    pageMargins: [20, 25, 20, 25],
    content: contents,
    styles: styles,
    defaultStyle: {
      font: "Roboto",
    },
  };
};
