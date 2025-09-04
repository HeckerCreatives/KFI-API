const { completeNumberDate } = require("../../../utils/date");
const { formatNumber, numberToWordsWithDecimals, numberToWords } = require("../../../utils/number");

exports.emergencyLoanPrintFile = (payTo, emergency, entries) => {
  const info = {
    title: "Emergency Loan",
  };

  let particulars = "";
  let accountEntries = [];
  let totalDebit = 0;
  let totalCredit = 0;
  let totalAmount = Number(emergency.amount);

  if (emergency.remarks) particulars += `${emergency.remarks}\n`;
  entries.map(entry => {
    if (entry.particular) particulars += `${entry.particular}\n`;
    if (entry.client) totalAmount -= Number(entry.credit);

    totalDebit += Number(entry.debit) || 0;
    totalCredit += Number(entry.credit) || 0;

    const isAdded = accountEntries.findIndex(e => e.code === entry.acctCode.code);

    if (isAdded < 0) {
      accountEntries.push({
        code: entry.acctCode.code,
        description: entry.acctCode.description,
        debit: Number(entry.debit) || 0,
        credit: Number(entry.credit) || 0,
      });
    }

    if (isAdded >= 0) {
      accountEntries[isAdded].debit += Number(entry.debit) || 0;
      accountEntries[isAdded].credit += Number(entry.credit) || 0;
    }
  });

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true, alignment: "center" },
    { text: "10001 Mt. Halcon St. , Umali Subd.", fontSize: 9, alignment: "center" },
    { text: "Batong Malake, Los Baños, Laguna", fontSize: 9, alignment: "center" },
    { text: "Tel. No. (049) 536-4501", fontSize: 9, alignment: "center" },
    { text: "EMERGENCY LOAN", fontSize: 9, bold: true, alignment: "center", margin: [0, 10, 0, 10] },
    {
      margin: [0, 0, 0, 10],
      table: {
        widths: ["*", "*", "*"],
        body: [
          [
            {
              table: {
                widths: ["13%", "*", "*"],
                body: [
                  [
                    { text: "PAY TO", fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                    { text: `${payTo}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 1], colSpan: 2 },
                    {},
                  ],
                  [
                    { text: "AMOUNT", fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                    {
                      border: [0, 0, 0, 0],
                      colSpan: 2,
                      table: {
                        widths: ["18%", "*"],
                        body: [
                          [
                            { text: "( In Figures )", fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                            { text: `P ${formatNumber(totalAmount)}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 1] },
                          ],
                        ],
                      },
                    },
                    {},
                  ],
                  [
                    { text: "", fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                    {
                      border: [0, 0, 0, 0],
                      colSpan: 2,
                      table: {
                        widths: ["18%", "*"],
                        body: [
                          [
                            { text: "( In Words )", fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                            { text: `${numberToWordsWithDecimals(Number(totalAmount).toFixed(2))}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 1] },
                          ],
                        ],
                      },
                    },
                    {},
                  ],
                ],
              },
              colSpan: 2,
              border: [0, 0, 0, 0],
            },
            {},
            {
              border: [0, 0, 0, 0],
              table: {
                widths: ["35%", "*"],
                body: [
                  [
                    { text: "DATE", fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                    { text: `${completeNumberDate(emergency.date)}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 1] },
                  ],
                  [
                    { text: "DOC. NO", fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                    { text: `${emergency.code}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 1] },
                  ],
                  [
                    { text: "BANK", fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                    { text: `${emergency.bankCode.description}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 1] },
                  ],
                  [
                    { text: "CHECK NO.", fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                    { text: `${emergency.checkNo}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 1] },
                  ],
                  [
                    { text: "CHECK DATE", fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                    { text: `${completeNumberDate(emergency.checkDate)}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 1] },
                  ],
                ],
              },
            },
          ],
        ],
      },
    },
    {
      table: {
        widths: ["10%", "*", "*", "10%", "10%"],
        body: [
          [{ text: "Particulars", colSpan: 5, fontSize: 8, bold: true, margin: [0, 0, 0, 0], alignment: "center" }, {}, {}, {}, {}],
          [{ text: `${particulars}`, colSpan: 5, fontSize: 8, margin: [0, 0, 0, 0], alignment: "left" }, {}, {}, {}, {}],
          [
            { text: "GL Code", fontSize: 8, bold: true, margin: [0, 0, 0, 0], alignment: "center" },
            { text: "CTR Code  Client Name", fontSize: 8, bold: true, margin: [0, 0, 0, 0], alignment: "center" },
            { text: "Account Titles", fontSize: 8, bold: true, margin: [0, 0, 0, 0], alignment: "center" },
            { text: "Debit", fontSize: 8, bold: true, margin: [0, 0, 0, 0], alignment: "center" },
            { text: "Credit", fontSize: 8, bold: true, margin: [0, 0, 0, 0], alignment: "center" },
          ],
          ...entries.map(entry => [
            { text: `${entry.acctCode.code}`, fontSize: 8, margin: [0, 0, 0, 0], alignment: "center", border: [0, 0, 0, 0] },
            {
              text: entry?.client?._id ? `${emergency?.center?.centerNo} - ${entry?.client?.name}` : "",
              fontSize: 8,
              margin: [0, 0, 0, 0],
              border: [0, 0, 0, 0],
            },
            { text: `${entry.acctCode.description}`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
            { text: `${formatNumber(entry.debit)}`, fontSize: 8, margin: [0, 0, 0, 0], alignment: "right", border: [0, 0, 0, 0] },
            { text: `${formatNumber(entry.credit)}`, fontSize: 8, margin: [0, 0, 0, 0], alignment: "right", border: [0, 0, 0, 0] },
          ]),
          [{ text: "", fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "center", colSpan: 5 }, {}, {}, {}, {}],
          [{ text: "", fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "center", colSpan: 5 }, {}, {}, {}, {}],
          ...accountEntries.map(entry => [
            { text: `${entry.code}`, fontSize: 8, margin: [0, 0, 0, 0], alignment: "center", border: [0, 0, 0, 0] },
            { text: `${entry.description}`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
            {
              text: "",
              fontSize: 8,

              margin: [0, 0, 0, 0],
              alignment: "center",
              border: [0, 0, 0, 0],
            },
            { text: `${formatNumber(entry.debit)}`, fontSize: 8, margin: [0, 0, 0, 0], alignment: "right", border: [0, 0, 0, 0] },
            { text: `${formatNumber(entry.credit)}`, fontSize: 8, margin: [0, 0, 0, 0], alignment: "right", border: [0, 0, 0, 0] },
          ]),
          [
            { text: "", border: [0, 0, 0, 0] },
            { text: "", border: [0, 0, 0, 0] },
            { text: "Grand Total:", fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
            { text: `${formatNumber(totalDebit)}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], alignment: "right", border: [0, 0, 0, 0] },
            { text: `${formatNumber(totalCredit)}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], alignment: "right", border: [0, 0, 0, 0] },
          ],
        ],
      },
    },
    {
      margin: [0, 10, 0, 0],
      table: {
        widths: ["*", "*", "*", "*"],
        body: [
          [
            { text: "PREPARED BY:", fontSize: 8, bold: true, alignment: "center" },
            { text: "CHECKED BY:", fontSize: 8, bold: true, alignment: "center" },
            { text: "NOTED/APPROVED BY:", fontSize: 8, bold: true, alignment: "center" },
            { text: "RECEIVED BY/DATE:", fontSize: 8, bold: true, alignment: "center" },
          ],
          [
            { text: "EVD", margin: [0, 3, 0, 3], fontSize: 8, bold: true, alignment: "center" },
            { text: "", margin: [0, 3, 0, 3] },
            { text: "", margin: [0, 3, 0, 3] },
            { text: "", margin: [0, 3, 0, 3] },
          ],
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
    pageMargins: [20, 25, 20, 25],
    content: contents,
    styles: styles,
    defaultStyle: {
      font: "Roboto",
    },
  };
};

// [
//             { text: "Doc. No.", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
//             { text: "Date", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
//             { text: "Supplier", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
//             { text: "Particular", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
//             { text: "Bank", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
//             { text: "Check No.", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
//             { text: "Check Date", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
//             { text: "Amount", fontSize: 10, alignment: "right", bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
//           ],
