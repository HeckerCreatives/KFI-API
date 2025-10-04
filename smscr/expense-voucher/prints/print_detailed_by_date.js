const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");

exports.evPrintDetailedByDate = (datas, from = "", to = "") => {
  const info = {
    title: "Expense Voucher",
  };

  const expenseVouchers = [];
  let totalAmount = 0;
  let fontSize = 9;

  datas.map(data => {
    totalAmount += Number(data.amount);
    let totalDebit = 0;
    let totalCredit = 0;

    expenseVouchers.push(
      [
        { text: ``, fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: ``, fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: ``, fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: data.remarks, colSpan: 3, fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        {},
        {},
        { text: formatNumber(data.amount), fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
        { text: "", fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      ],
      [
        { text: `Bank`, fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: `${data.bank.code}`, fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: data?.checkNo ? `Check No.     ${data.checkNo}` : "", fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: `Check Date     ${completeNumberDate(data.checkDate)}`, colSpan: 3, fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        {},
        {},
        { text: "", fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
        { text: "", fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      ],
      Array.from({ length: 8 }, () => ({ text: ``, fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] })),
      [
        { text: "", fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: "", fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: "", fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        {
          border: [0, 0, 0, 0],
          colSpan: 5,
          table: {
            widths: ["*", "*", "10%", "10%", "*"],
            body: [
              [
                { text: "GL Code", fontSize, bold: true, margin: [0, 3, 0, 1], border: [0, 0, 0, 1] },
                { text: "Account Title", fontSize, bold: true, margin: [0, 3, 0, 1], border: [0, 0, 0, 1] },
                { text: "Debit", fontSize, bold: true, margin: [0, 3, 0, 1], border: [0, 0, 0, 1], alignment: "right" },
                { text: "Credit", fontSize, bold: true, margin: [0, 3, 0, 1], border: [0, 0, 0, 1], alignment: "right" },
                { text: "Ctr Code - Client Name", fontSize, bold: true, margin: [0, 3, 0, 1], border: [0, 0, 0, 1] },
              ],
            ],
          },
        },
        {},
        {},
        {},
        {},
      ],
      ...data.entries.map(entry => {
        totalDebit += Number(entry.debit);
        totalCredit += Number(entry.credit);
        return [
          { text: completeNumberDate(data.date), fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
          { text: data.code, fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
          { text: data.supplier, fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
          {
            border: [0, 0, 0, 0],
            colSpan: 5,
            table: {
              widths: ["*", "*", "10%", "10%", "*"],
              body: [
                [
                  { text: entry.acctCode.code, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                  { text: entry.acctCode.description, fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                  { text: formatNumber(entry.debit), fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
                  { text: formatNumber(entry.credit), fontSize, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
                  {
                    text: entry.client?.center?.centerNo ? `${entry.client?.center?.centerNo} - ${entry.client?.name}` : "",
                    fontSize,
                    margin: [0, 0, 0, 0],
                    border: [0, 0, 0, 0],
                  },
                ],
              ],
            },
          },
          {},
          {},
          {},
          {},
        ];
      }),
      Array.from({ length: 8 }, () => ({ text: ``, fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] })),
      [
        { text: "", fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: "", fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: "", fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        {
          border: [0, 0, 0, 0],
          colSpan: 5,
          table: {
            widths: ["*", "*", "10%", "10%", "*"],
            body: [
              [
                { text: "", fontSize, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                { text: "", fontSize, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                { text: formatNumber(totalDebit), fontSize, bold: true, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
                { text: formatNumber(totalCredit), fontSize, bold: true, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
                { text: "", fontSize, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
              ],
            ],
          },
        },
        {},
        {},
        {},
        {},
      ],
      Array.from({ length: 8 }, () => ({ text: ``, fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] })),
      [
        { text: "", fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: "", fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: "", fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        {
          border: [0, 0, 0, 0],
          colSpan: 5,
          table: {
            widths: ["*", "*", "10%", "10%", "*"],
            body: [
              [
                { text: "", fontSize, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                { text: "", fontSize, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
                { text: formatNumber(totalDebit), fontSize, bold: true, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
                { text: formatNumber(totalCredit), fontSize, bold: true, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
                { text: "", fontSize, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
              ],
            ],
          },
        },
        {},
        {},
        {},
        {},
      ],
      Array.from({ length: 8 }, () => ({ text: ``, fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] })),
      Array.from({ length: 8 }, () => ({ text: ``, fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] }))
    );
  });

  expenseVouchers.push([
    { text: ``, fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    { text: ``, fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    { text: ``, fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    { text: "Grand Total: ", colSpan: 3, fontSize, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
    { text: "" },
    { text: "" },
    { text: formatNumber(totalAmount), fontSize, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },

    { text: "", border: [0, 0, 0, 0] },
  ]);

  let title = "";
  if (from && !to) title = `Date Period From ${from}`;
  if (to && !from) title = `Date Period To ${to}`;
  if (to && from) title = `Date Period From ${from} To ${to}`;

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "Expense Voucher By Date ( Detailed )", fontSize: 9 },
    { text: title, fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["10%", "10%", "20%", "20%", "10%", "10%", "10%", "10%"],
        body: [
          [
            { text: "Date", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1] },
            { text: "Doc. No.", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1] },
            { text: "Supplier", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1] },
            { text: "Particular", colSpan: 3, fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1] },
            {},
            {},
            { text: "Amount", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1], alignment: "right" },
            { text: "", fontSize, bold: true, margin: [0, 3, 0, 3], border: [0, 1, 0, 1] },
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
