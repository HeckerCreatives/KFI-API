const { completeNumberDate, getMonth, getYear } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");

exports.printActivityReportPDF = (entries, beginningBalance, from, to) => {
  const info = { title: "G/L Activity Report" };

  const rows = [];
  let totalDebit = 0;
  let totalCredit = 0;

  entries.map((chart, i) => {
    rows.push([{ text: chart.description, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left", colSpan: 7 }, {}, {}, {}, {}, {}, {}]);
    chart.entries.map((entry, h) => {
      if (beginningBalance && i === 0 && h === 0) {
        totalDebit += Number(beginningBalance?.debit || 0);
        totalCredit += Number(beginningBalance?.credit || 0);
        rows.push([
          { text: "Beg. Balance", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
          { text: `${completeNumberDate(from)}`, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
          { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
          { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
          { text: `${formatNumber(beginningBalance.debit)}`, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
          { text: `${formatNumber(beginningBalance.credit)}`, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
          { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
        ]);
      }

      totalDebit += Number(entry?.debit || 0);
      totalCredit += Number(entry?.credit || 0);

      rows.push([
        { text: `${entry.doc}`, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
        { text: `${completeNumberDate(entry.date)}`, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
        { text: `${getMonth(entry.date)}`, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
        { text: `${getYear(entry.date)}`, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
        { text: `${formatNumber(entry.debit)}`, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
        { text: `${formatNumber(entry.credit)}`, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
        { text: `${entry?.particular || ""}`, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
      ]);
    });
  });

  const difference = totalDebit - totalCredit;

  rows.push([
    { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
    { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
    { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
    { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
    { text: `${formatNumber(totalDebit)}`, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 1, 0, 0], alignment: "right" },
    { text: `${formatNumber(totalCredit)}`, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 1, 0, 0], alignment: "right" },
    { text: `${formatNumber(Math.abs(difference))}`, fontSize: 8, bold: true, margin: [0, 1, 0, 0], border: [0, 0, 0, 0], alignment: "left" },
  ]);

  rows.push([
    { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
    { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
    { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
    { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
    { text: `${formatNumber(totalDebit)}`, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalCredit)}`, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },
    { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
  ]);

  rows.push([
    { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
    { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
    { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
    { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
    { text: `${formatNumber(difference >= 0 ? Math.abs(difference) : 0)}`, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 1, 0, 0], alignment: "right" },
    { text: `${formatNumber(difference <= 0 ? Math.abs(difference) : 0)}`, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 1, 0, 0], alignment: "right" },
    { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
  ]);

  rows.push([
    { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
    { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
    { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
    { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
    { text: `${formatNumber(totalDebit)}`, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 1, 0, 0], alignment: "right" },
    { text: `${formatNumber(totalCredit)}`, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 1, 0, 0], alignment: "right" },
    { text: `${formatNumber(Math.abs(difference))}`, fontSize: 8, bold: true, margin: [0, 1, 0, 0], border: [0, 0, 0, 0], alignment: "left" },
  ]);

  let title = "";
  if (from && !to) title = `Period Covered From ${completeNumberDate(from)}`;
  if (to && !from) title = `Period Covered To ${completeNumberDate(to)}`;
  if (to && from) title = `Period Covered From ${completeNumberDate(from)} To ${completeNumberDate(to)}`;

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "G / L Activity", fontSize: 9 },
    { text: title, fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["15%", "10%", "10%", "10%", "12.5%", "12.5%", "30%"],
        body: [
          [
            { text: "Doc. No.", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Date", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Month", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Year", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Debit", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Credit", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Remarks", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
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
