const { completeNumberDate, getMonth, getYear } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");

exports.printAuditTrailReportPDF = (entries, beginningBalance, from, to) => {
  const info = { title: "G/L Audit Trail Report" };

  const rows = [];
  let totalDebit = 0;
  let totalCredit = 0;

  entries.map((chart, i) => {
    chart.entries.map((entry, h) => {
      if (beginningBalance && i === 0 && h === 0) {
        totalDebit += Number(beginningBalance?.debit || 0);
        totalCredit += Number(beginningBalance?.credit || 0);
        rows.push([
          { text: "Beg. Balance", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
          { text: `${completeNumberDate(from)}`, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
          { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
          { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
          { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
          { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
          { text: `${formatNumber(beginningBalance.debit)}`, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
          { text: `${formatNumber(beginningBalance.credit)}`, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
        ]);

        rows.push([
          { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
          { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
          { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
          { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
          { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
          { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
          {
            text: `${Number(beginningBalance.debit) !== 0 ? formatNumber(beginningBalance.debit) : ""}`,
            fontSize: 8,
            bold: true,
            margin: [0, 0, 0, 0],
            border: [0, 1, 0, 0],
            alignment: "right",
          },
          {
            text: `${Number(beginningBalance.credit) !== 0 ? formatNumber(beginningBalance.credit) : ""}`,
            fontSize: 8,
            bold: true,
            margin: [0, 0, 0, 0],
            border: [0, 1, 0, 0],
            alignment: "right",
          },
        ]);
      }

      totalDebit += Number(entry?.debit || 0);
      totalCredit += Number(entry?.credit || 0);

      rows.push([
        { text: `${entry.doc}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "left" },
        { text: `${completeNumberDate(entry.date)}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "left" },
        { text: `${entry?.particular || ""}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "left" },
        { text: `${entry?.acctOfficer || ""}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "left" },
        { text: `${chart.code}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "left" },
        { text: `${chart.description}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "left" },
        { text: `${formatNumber(entry.debit)}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
        { text: `${formatNumber(entry.credit)}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
      ]);

      rows.push([
        { text: ``, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "left" },
        { text: ``, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "left" },
        { text: ``, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "left" },
        { text: ``, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "left" },
        { text: ``, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "left" },
        { text: ``, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "left" },
        { text: `${Number(entry.debit) !== 0 ? formatNumber(entry.debit) : ""}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 1, 0, 0], alignment: "right" },
        { text: `${Number(entry.credit) !== 0 ? formatNumber(entry.credit) : ""}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 1, 0, 0], alignment: "right" },
      ]);
    });
  });

  rows.push(Array.from({ length: 8 }, () => ({ text: "", border: [0, 0, 0, 0], margin: [0, 5, 0, 5] })));

  rows.push([
    { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
    { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
    { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
    { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
    { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
    { text: "", fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "left" },
    { text: `${formatNumber(totalDebit)}`, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalCredit)}`, fontSize: 8, bold: true, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },
  ]);

  let title = "";
  if (from && !to) title = `Period Covered From ${completeNumberDate(from)}`;
  if (to && !from) title = `Period Covered To ${completeNumberDate(to)}`;
  if (to && from) title = `Period Covered From ${completeNumberDate(from)} To ${completeNumberDate(to)}`;

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "G / L Audit Trail", fontSize: 9 },
    { text: title, fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["10%", "10%", "19%", "10%", "12%", "19%", "10%", "10%"],
        body: [
          [
            { text: "Doc. No.", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Date", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Description", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Acct. Officer", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Account Code", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Description", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
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
    pageMargins: [10, 25, 10, 25],
    content: contents,
    styles: styles,
    defaultStyle: {
      font: "Roboto",
    },
  };
};
