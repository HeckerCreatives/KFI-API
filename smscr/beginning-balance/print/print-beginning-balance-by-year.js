const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");

exports.printBeginningBalanceByYearPDF = (beginningBalance, entries) => {
  const info = { title: "Beginnning Balance" };

  let totalDebit = 0;
  let totalCredit = 0;

  const beginningBalanceEntries = entries
    .sort((a, b) => a.acctCode.code.localeCompare(b.acctCode.code))
    .map(data => {
      totalDebit += Number(data.debit);
      totalCredit += Number(data.credit);
      return [
        { text: data.acctCode.code, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: data.acctCode.description, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: formatNumber(data.debit), fontSize: 8, alignment: "right", margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: formatNumber(data.credit), fontSize: 8, alignment: "right", margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      ];
    });

  beginningBalanceEntries.push([
    { text: "", fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    { text: "Total: ", fontSize: 8, alignment: "right", margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    { text: formatNumber(totalDebit), fontSize: 8, alignment: "right", margin: [0, 1, 0, 1], border: [0, 1, 0, 1] },
    { text: formatNumber(totalCredit), fontSize: 8, alignment: "right", margin: [0, 1, 0, 1], border: [0, 1, 0, 1] },
  ]);

  const contents = [
    { text: "G/L Journal Entries", fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["33.33%", "33.33%", "33.33%"],
        body: [
          [
            { text: `Doc. No.: BEGBAL${beginningBalance.year}`, fontSize: 9, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
            { text: `Department:`, fontSize: 9, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
            { text: `Date: 1/1/${beginningBalance.year}`, fontSize: 9, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
          ],
        ],
      },
    },
    {
      table: {
        widths: ["33.33%", "33.33%", "33.33%"],
        body: [
          [
            { text: `Acct. Mon.: 0`, fontSize: 9, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
            { text: `Year: ${beginningBalance.year}`, fontSize: 9, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
            { text: `Book:`, fontSize: 9, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
          ],
        ],
      },
    },
    {
      table: {
        widths: ["33.33%", "33.33%", "33.33%"],
        body: [
          [
            { text: `Ref. No.: `, fontSize: 9, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
            { text: `Remarks: `, fontSize: 9, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
            { text: ``, fontSize: 9, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
          ],
        ],
      },
    },
    {
      table: {
        widths: ["33.33%", "33.33%", "33.33%"],
        body: [
          [
            { text: `Memo: ${beginningBalance.memo}`, colSpan: 3, fontSize: 9, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
            { text: ``, fontSize: 9, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
            { text: ``, fontSize: 9, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
          ],
        ],
      },
    },
    {
      table: {
        widths: ["15%", "55%", "15%", "15%"],
        body: [
          [
            { text: "Account Code", fontSize: 9, bold: true, margin: [0, 0, 0, 0], border: [0, 1, 0, 1] },
            { text: "Account Description", fontSize: 9, bold: true, margin: [0, 0, 0, 0], border: [0, 1, 0, 1] },
            { text: "Debit", fontSize: 9, bold: true, alignment: "right", margin: [0, 0, 0, 0], border: [0, 1, 0, 1] },
            { text: "Credit", fontSize: 9, bold: true, alignment: "right", margin: [0, 0, 0, 0], border: [0, 1, 0, 1] },
          ],
          ...beginningBalanceEntries,
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
    pageOrientation: "portrait",
    content: contents,
    styles: styles,
    defaultStyle: {
      font: "Roboto",
    },
  };
};
