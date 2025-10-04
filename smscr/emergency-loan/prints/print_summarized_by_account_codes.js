const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");

exports.elPrintSummarizedByAccounts = (datas, from = "", to = "") => {
  const info = { title: "Emergency Loan" };

  const rows = [];

  let totalDebit = 0;
  let totalCredit = 0;

  datas.map(data => {
    rows.push([{ text: `Account:   ${data.code} - ${data.description}`, colSpan: 6, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] }, {}, {}, {}, {}, {}]);
    let emergencies = [];
    let astDebit = 0;
    let astCredit = 0;

    data.entries.map(entry => {
      let name = entry?.client ? `${entry?.client?.name}` : "NotApplicable";
      const isAdded = emergencies.findIndex(e => e.name === name);
      if (isAdded < 0) emergencies.push({ name, entries: [entry] });
      if (isAdded >= 0) emergencies[isAdded].entries.push(entry);
    });

    emergencies.map(loan => {
      let stDebit = 0;
      let stCredit = 0;
      loan.entries.map(entry => {
        stDebit += Number(entry?.debit || 0);
        stCredit += Number(entry?.credit || 0);
        rows.push([
          { text: entry?.client ? `${entry?.client?.name}` : "", fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
          { text: `${completeNumberDate(entry.emergency.date)}`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
          { text: `${entry.emergency.code}`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
          { text: `${entry?.emergency?.nature || ""}`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
          { text: `${formatNumber(entry.debit)}`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
          { text: `${formatNumber(entry.credit)}`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
        ]);
      });
      totalDebit += stDebit;
      totalCredit += stCredit;
      astDebit += stDebit;
      astCredit += stCredit;

      rows.push([
        { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: `Sub-Total: `, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
        { text: `${formatNumber(stDebit)}`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 0], alignment: "right" },
        { text: `${formatNumber(stCredit)}`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 0], alignment: "right" },
      ]);
    });
    rows.push([...Array.from({ length: 6 }, () => ({ text: ``, fontSize: 8, margin: [0, 5, 0, 5], border: [0, 0, 0, 0] }))]);
    rows.push([
      { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: `Account Sub-Total: `, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
      { text: `${formatNumber(astDebit)}`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 0], alignment: "right" },
      { text: `${formatNumber(astCredit)}`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 0], alignment: "right" },
    ]);
  });
  rows.push([...Array.from({ length: 6 }, () => ({ text: ``, fontSize: 8, margin: [0, 5, 0, 5], border: [0, 0, 0, 0] }))]);
  rows.push([
    { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: `Grand Total: `, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
    { text: `${formatNumber(totalDebit)}`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalCredit)}`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
  ]);

  let title = "";
  if (from && !to) title = `Date From ${completeNumberDate(from)}`;
  if (to && !from) title = `Date To ${completeNumberDate(to)}`;
  if (to && from) title = `Date From ${completeNumberDate(from)} To ${completeNumberDate(to)}`;

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "Emergency Loan By Account ( Sort By Client )", fontSize: 9 },
    { text: title, fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["25%", "10%", "15%", "30%", "10%", "10%"],
        body: [
          [
            { text: "", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Date", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Doc. No.", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Nature", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Debit", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Credit", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
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
    pageMargins: [10, 25, 10, 30],
    content: contents,
    styles: styles,
    defaultStyle: {
      font: "Roboto",
    },
  };
};
