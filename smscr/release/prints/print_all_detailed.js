const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");

exports.releaseDetailedPrintAll = (datas, from = "", to = "") => {
  const info = {
    title: "Release",
  };

  const expenseVouchers = [];

  datas.map(data => {
    expenseVouchers.push(
      [
        { text: `CV#${data.code}`, fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: completeNumberDate(data.date), fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: data.remarks, fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: data.bankCode.description, fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: data.checkNo, fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: completeNumberDate(data.checkDate), fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: formatNumber(data.amount), fontSize: 10, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      ],
      [
        {
          border: [0, 0, 0, 0],
          table: {
            widths: ["10%", "*", "15%", "15%", "*"],
            body: [
              [
                { table: { widths: ["*"], body: [[{ text: "Account Code", fontSize: 9, bold: true, margin: [0, 4.5, 0, 0], border: [0, 0, 0, 1] }]] }, border: [0, 0, 0, 0] },
                { table: { widths: ["*"], body: [[{ text: "Description", fontSize: 9, bold: true, margin: [0, 4.5, 0, 0], border: [0, 0, 0, 1] }]] }, border: [0, 0, 0, 0] },
                { table: { widths: ["*"], body: [[{ text: "Debit", fontSize: 9, bold: true, margin: [0, 4.5, 0, 0], border: [0, 0, 0, 1] }]] }, border: [0, 0, 0, 0] },
                { table: { widths: ["*"], body: [[{ text: "Credit", fontSize: 9, bold: true, margin: [0, 4.5, 0, 0], border: [0, 0, 0, 1] }]] }, border: [0, 0, 0, 0] },
                { table: { widths: ["*"], body: [[{ text: "Particulars", fontSize: 9, bold: true, margin: [0, 4.5, 0, 0], border: [0, 0, 0, 1] }]] }, border: [0, 0, 0, 0] },
              ],
              ...data.entries.map((entry, i) => {
                return [
                  { table: { widths: ["*"], body: [[{ text: entry.acctCode.code, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] }]] }, border: [0, 0, 0, 0] },
                  { table: { widths: ["*"], body: [[{ text: entry.acctCode.description, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] }]] }, border: [0, 0, 0, 0] },
                  {
                    table: {
                      widths: ["*"],
                      body: [
                        [{ text: formatNumber(entry.debit), alignment: "right", fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, i + 1 === data.entries.length ? 1 : 0] }],
                      ],
                    },
                    border: [0, 0, 0, 0],
                  },
                  {
                    table: {
                      widths: ["*"],
                      body: [
                        [{ text: formatNumber(entry.credit), alignment: "right", fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, i + 1 === data.entries.length ? 1 : 0] }],
                      ],
                    },
                    border: [0, 0, 0, 0],
                  },
                  { table: { widths: ["*"], body: [[{ text: entry.particular, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] }]] }, border: [0, 0, 0] },
                ];
              }),
              [
                { text: "", border: [0, 0, 0, 0] },
                { text: "", border: [0, 0, 0, 0] },
                {
                  table: {
                    widths: ["*"],
                    body: [
                      [
                        {
                          text: formatNumber(data.entries.reduce((acc, obj) => acc + (obj.debit || 0), 0)),
                          alignment: "right",
                          fontSize: 8,
                          border: [0, 0, 0, 1],
                        },
                      ],
                    ],
                  },
                  border: [0, 0, 0, 0],
                },
                {
                  table: {
                    widths: ["*"],
                    body: [
                      [
                        {
                          text: formatNumber(data.entries.reduce((acc, obj) => acc + (obj.credit || 0), 0)),
                          alignment: "right",
                          fontSize: 8,
                          border: [0, 0, 0, 1],
                        },
                      ],
                    ],
                  },
                  border: [0, 0, 0, 0],
                },
                { text: "", border: [0, 0, 0, 0] },
              ],
              [{ colSpan: 5, text: "", margin: [0, 3, 0, 3], border: [0, 0, 0, 0] }, {}, {}, {}, {}],
            ],
          },
          colSpan: 7,
        },
        {},
        {},
        {},
        {},
        {},
        {},
      ]
    );
  });

  let title = "";
  if (from && !to) title = `Doc. No. From CV#${from}`;
  if (to && !from) title = `Doc. No. To CV#${to}`;
  if (to && from) title = `Doc. No. From CV#${from} To CV#${to}`;

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "Release By Doc. No. (Detailed)", fontSize: 9 },
    { text: title, fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["*", "*", "*", "*", "*", "*", "*"],
        body: [
          [
            { text: "Doc. No.", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
            { text: "Date", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
            { text: "Particular", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
            { text: "Bank", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
            { text: "Check No.", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
            { text: "Check Date", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
            { text: "Amount", fontSize: 10, bold: true, margin: [0, 4.5, 0, 0], border: [0, 1, 0, 1] },
          ],
          ...expenseVouchers,
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
