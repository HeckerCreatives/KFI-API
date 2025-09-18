const { completeNumberDate } = require("../../../utils/date");
const { formatNumber, numberToWordsWithDecimals, numberToWords } = require("../../../utils/number");

exports.acknowledgementReceiptPrintFile = (payTo, officialReceipt, entries) => {
  const info = {
    title: "Acknowledgement Receipt",
  };

  let particulars = "";
  let accountEntries = [];
  let totalDebit = 0;
  let totalCredit = 0;
  let totalAmount = Number(officialReceipt.amount);

  if (officialReceipt.remarks) particulars += `${officialReceipt.remarks}\n`;
  entries.map(entry => {
    if (entry.particular) particulars += `${entry.particular}\n`;
    if (entry?.client) totalAmount -= Number(entry.credit);

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
    { text: "OFFICIAL RECEIPT (ACKNOWLEDGEMENT)", fontSize: 9, bold: true, alignment: "center", margin: [0, 10, 0, 10] },
    {
      margin: [0, 0, 0, 10],
      table: {
        widths: ["*", "*", "*"],
        body: [
          [
            {
              table: {
                widths: ["20%", "*", "*"],
                body: [
                  [
                    { text: "RECEIVED FROM", fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                    { text: `${payTo}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 1], colSpan: 2 },
                    {},
                  ],
                  [
                    { text: "AMOUNT", fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                    {
                      border: [0, 0, 0, 0],
                      colSpan: 2,
                      table: {
                        widths: ["20%", "*"],
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
                        widths: ["20%", "*"],
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
                  [
                    { text: "MODE OF PAYMENT", fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                    { text: `${officialReceipt.type.toUpperCase()}`, fontSize: 8, bold: true, margin: [0, 5, 0, 0], border: [0, 0, 0, 1], colSpan: 2 },
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
                    { text: `${completeNumberDate(officialReceipt.date)}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 1] },
                  ],
                  [
                    { text: "DOC. NO", fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                    { text: `${officialReceipt.code}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 1] },
                  ],
                  [
                    { text: "CENTER", fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                    { text: `${officialReceipt.center.centerNo}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 1] },
                  ],
                  [
                    { text: "AO", fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                    { text: `${officialReceipt.acctOfficer}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 1] },
                  ],
                  [
                    { text: "BANK", fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                    { text: `${officialReceipt.bankCode.description}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 1] },
                  ],
                  [
                    { text: "CHECK NO.", fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                    { text: `${officialReceipt.checkNo}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 1] },
                  ],
                  [
                    { text: "CHECK DATE", fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                    { text: `${completeNumberDate(officialReceipt.checkDate)}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 1] },
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
              text: entry?.client?._id ? `${entry.center.centerNo} - ${entry?.client?.name}` : "",
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
  ];

  const styles = [];

  const footer = function (currentPage, pageCount) {
    if (currentPage === pageCount) {
      return {
        margin: [10, 0, 10, 0],
        table: {
          widths: ["*", "*", "*", "*", "*"],
          body: [
            [
              { text: "PREPARED BY:", fontSize: 8, bold: true, alignment: "center" },
              { text: "CHECKED BY:", fontSize: 8, bold: true, alignment: "center" },
              { text: "APPROVED BY:", fontSize: 8, bold: true, alignment: "center" },
              { text: "RECEIVED BY/DATE:", fontSize: 8, bold: true, alignment: "center" },
              { text: "DATE POSTED:", fontSize: 8, bold: true, alignment: "center" },
            ],
            [
              { text: `${officialReceipt.preparedBy}`, margin: [0, 3, 0, 3], fontSize: 8, bold: true, alignment: "center" },
              { text: `${officialReceipt.checkedBy}`, margin: [0, 3, 0, 3], fontSize: 8, bold: true, alignment: "center" },
              { text: `${officialReceipt.approvedBy}`, margin: [0, 3, 0, 3], fontSize: 8, bold: true, alignment: "center" },
              { text: `${officialReceipt.receivedBy}`, margin: [0, 3, 0, 3], fontSize: 8, bold: true, alignment: "center" },
              { text: `${completeNumberDate(officialReceipt.datePosted)}`, margin: [0, 3, 0, 3], fontSize: 8, bold: true, alignment: "center" },
            ],
            [{ text: ``, alignment: "right", fontSize: 8, colSpan: 5, border: [0, 0, 0, 0] }, {}, {}, {}, {}],
            [{ text: `Page ${currentPage} of ${pageCount}`, alignment: "right", fontSize: 8, colSpan: 5, border: [0, 0, 0, 0] }, {}, {}, {}, {}],
          ],
        },
      };
    } else {
      return {
        text: `Page ${currentPage} of ${pageCount}`,
        alignment: "right",
        fontSize: 8,
        margin: [0, 5, 20, 0],
      };
    }
  };

  return {
    info: info,
    pageOrientation: "portrait",
    footer: footer,
    pageMargins: [20, 25, 20, 60],
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
