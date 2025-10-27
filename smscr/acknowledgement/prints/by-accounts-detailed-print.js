const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");

exports.ackPrintByAccountsDetailed = (datas, from = "", to = "") => {
  const info = { title: "Official Receipt" };

  const rows = [];

  let totalDebit = 0;
  let totalCredit = 0;

  datas.map(official => {
    let codeTotalDebit = 0;
    let codeTotalCredit = 0;

    rows.push([{ text: `${official.code} - ${official.description}`, colSpan: 6, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] }, {}, {}, {}, {}, {}]);
    official.entries.map(data => {
      totalCredit += Number(data.credit);
      codeTotalCredit += Number(data.credit);
      totalDebit += Number(data.debit);
      codeTotalDebit += Number(data.debit);

      rows.push([
        { text: data?.client ? `${data.client.name}` : "", fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: `${completeNumberDate(data?.acknowledgement.date)}`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: `${data?.acknowledgement.code}`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: `${data.acknowledgement.center.centerNo} - ${data.acknowledgement.center.description}`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: `${formatNumber(data.debit)}`, alignment: "right", fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: `${formatNumber(data.credit)}`, alignment: "right", fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      ]);
    });

    rows.push([
      { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: ``, alignment: "right", fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: `${formatNumber(codeTotalDebit)}`, alignment: "right", fontSize: 8, margin: [0, 1, 0, 1], border: [0, 1, 0, 0] },
      { text: `${formatNumber(codeTotalCredit)}`, alignment: "right", fontSize: 8, margin: [0, 1, 0, 1], border: [0, 1, 0, 0] },
    ]);
  });

  rows.push(Array.from({ length: 6 }, () => ({ text: ``, fontSize: 8, margin: [0, 2, 0, 2], border: [0, 0, 0, 0] })));

  rows.push([
    { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    { text: `Grand Total: `, alignment: "right", fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    { text: `${formatNumber(totalDebit)}`, alignment: "right", fontSize: 8, margin: [0, 1, 0, 1], border: [0, 1, 0, 1] },
    { text: `${formatNumber(totalCredit)}`, alignment: "right", fontSize: 8, margin: [0, 1, 0, 1], border: [0, 1, 0, 1] },
  ]);

  let title = "";
  if (from && !to) title = `Date From ${completeNumberDate(from)}`;
  if (to && !from) title = `Date To ${completeNumberDate(to)}`;
  if (to && from) title = `Date From ${completeNumberDate(from)} To ${completeNumberDate(to)}`;

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "Official Receipt By Account Code ( Detailed )", fontSize: 9 },
    { text: title, fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["25%", "12.5%", "12.5%", "30%", "10%", "10%"],
        body: [
          [
            { text: "Client", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Date", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Doc. No", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Center", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Debit", alignment: "right", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1] },
            { text: "Credit", alignment: "right", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1] },
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
