const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");

exports.loanReleasePrintByBank = datas => {
  const info = {
    title: "Loan Release",
  };

  const loanReleases = [];
  let total = 0;

  datas.map((data, i) => {
    loanReleases.push([
      { text: `Bank: `, fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], bold: true },
      { text: `${data.code} - ${data.description}`, colSpan: 3, fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], bold: true },
      {},
      {},
      { text: ``, fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: ``, fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    ]);

    let totalPerBank = 0;

    data.transactions.map(transaction => {
      total += Number(transaction.amount);
      totalPerBank += Number(transaction.amount);

      loanReleases.push([
        { text: completeNumberDate(transaction.checkDate), fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: `${transaction?.checkNo || ""}`, fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: `${transaction.code}`, fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: `${transaction.center.centerNo} - ${transaction.center.description}`, fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: transaction.remarks, fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: formatNumber(transaction.amount), fontSize: 10, alignment: "right", margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      ]);
    });

    loanReleases.push([
      { text: "Bank Sub Total: ", border: [0, 0, 0, 0], margin: [0, 0, 10, 0], fontSize: 10, colSpan: 5, alignment: "right" },
      {},
      {},
      {},
      {},
      { text: formatNumber(totalPerBank), alignment: "right", fontSize: 10, border: [0, 1, 0, 1] },
    ]);

    loanReleases.push(Array.from({ length: 6 }, () => ({ text: ``, fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] })));
  });

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "Loan Release By Banks", fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["7%", "8%", "11%", "32%", "32%", "10%"],
        body: [
          [
            { text: "Check Date", fontSize: 10, bold: true, margin: [0, 4, 0, 4], border: [0, 1, 0, 1] },
            { text: "Check No", fontSize: 10, bold: true, margin: [0, 4, 0, 4], border: [0, 1, 0, 1] },
            { text: "Doc No", fontSize: 10, bold: true, margin: [0, 4, 0, 4], border: [0, 1, 0, 1] },
            { text: "Client", fontSize: 10, bold: true, margin: [0, 4, 0, 4], border: [0, 1, 0, 1] },
            { text: "Particulars", fontSize: 10, bold: true, margin: [0, 4, 0, 4], border: [0, 1, 0, 1] },
            { text: "Amount", fontSize: 10, alignment: "right", bold: true, margin: [0, 4, 0, 4], border: [0, 1, 0, 1] },
          ],
          ...loanReleases,
          Array.from({ length: 6 }, () => ({ text: ``, fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] })),
          [{ text: "", border: [0, 0, 0, 0], colSpan: 5 }, {}, {}, {}, {}, { text: formatNumber(total), alignment: "right", fontSize: 10, border: [0, 1, 0, 1] }],
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
