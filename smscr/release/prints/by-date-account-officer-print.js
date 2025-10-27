const { loanCodes } = require("../../../constants/loan-codes");
const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");

exports.relPrintByDateByAccountOfficer = (datas, from = "", to = "") => {
  const info = { title: "Acknowledgement Receipt" };

  const rows = [];

  let totalPrincipal = 0;
  let totalInterest = 0;
  let totalWSF = 0;
  let totalDamayan = 0;
  let totalCGT = 0;
  let totalEmergency = 0;

  datas.map(release => {
    rows.push([
      { text: `${release._id}`, colSpan: 10, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    ]);

    let officerTotalPrincipal = 0;
    let officerTotalInterest = 0;
    let officerTotalWSF = 0;
    let officerTotalDamayan = 0;
    let officerTotalCGT = 0;
    let officerTotalEmergency = 0;
    release.releases.map(data => {
      const principal = data.entries.reduce((acc, entry) => {
        if (loanCodes.includes(entry.acctCode.code)) acc += Number(entry?.debit || 0);
        return acc;
      }, 0);
      totalPrincipal += principal;
      officerTotalPrincipal += principal;

      const interest = data.entries.reduce((acc, entry) => {
        if (entry.acctCode.code === "4045") acc += Number(entry?.debit || 0);
        return acc;
      }, 0);
      totalInterest += interest;
      officerTotalInterest += interest;

      const wsf = data.entries.reduce((acc, entry) => {
        if (entry.acctCode.code === "2010C") acc += Number(entry?.debit || 0);
        return acc;
      }, 0);
      totalWSF += wsf;
      officerTotalWSF += wsf;

      const damayan = data.entries.reduce((acc, entry) => {
        if (entry.acctCode.code === "2010D") acc += Number(entry?.debit || 0);
        return acc;
      }, 0);
      totalDamayan += damayan;
      officerTotalDamayan += damayan;

      rows.push([
        { text: completeNumberDate(data.date), fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: `${data?.code}`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: `${data.center.centerNo} - ${data.center.description}`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: data.bankCode.description, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
        { text: formatNumber(principal), fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
        { text: formatNumber(interest), fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
        { text: formatNumber(wsf), fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
        { text: formatNumber(damayan), fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
        { text: formatNumber(0), fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
        { text: formatNumber(0), fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0], alignment: "right" },
      ]);
    });

    rows.push([
      { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
      { text: `${formatNumber(officerTotalPrincipal)}`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },
      { text: `${formatNumber(officerTotalInterest)}`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },
      { text: `${formatNumber(officerTotalWSF)}`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },
      { text: `${formatNumber(officerTotalDamayan)}`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },
      { text: `${formatNumber(officerTotalCGT)}`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },
      { text: `${formatNumber(officerTotalEmergency)}`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },
    ]);
  });

  rows.push(Array.from({ length: 10 }, () => ({ text: ``, fontSize: 8, margin: [0, 2, 0, 2], border: [0, 0, 0, 0] })));

  rows.push([
    { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    { text: ``, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 0, 0, 0] },
    { text: `${formatNumber(totalPrincipal)}`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalInterest)}`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalWSF)}`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalDamayan)}`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalCGT)}`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalEmergency)}`, fontSize: 8, margin: [0, 1, 0, 1], border: [0, 1, 0, 1], alignment: "right" },
  ]);

  let title = "";
  if (from && !to) title = `Date From ${completeNumberDate(from)}`;
  if (to && !from) title = `Date To ${completeNumberDate(to)}`;
  if (to && from) title = `Date From ${completeNumberDate(from)} To ${completeNumberDate(to)}`;

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "Acknowledgement Receipt By Date ( Account Officer )", fontSize: 9 },
    { text: title, fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["7%", "9%", "18%", "18%", "8%", "8%", "8%", "8%", "8%", "8%"],
        body: [
          [
            { text: "Date", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Doc. No.", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Center", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Bank", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Principal", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Interest", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "WSF", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Damayan", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "CGT", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Emergency", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
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
    pageOrientation: "landscape",
    footer: footer,
    pageMargins: [10, 25, 10, 25],
    content: contents,
    styles: styles,
    defaultStyle: {
      font: "Roboto",
    },
  };
};
