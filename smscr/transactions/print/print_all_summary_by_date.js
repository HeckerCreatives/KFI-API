const { bankCodes } = require("../../../constants/bank-codes");
const { loanCodes } = require("../../../constants/loan-codes");
const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");

exports.loanReleaseSummarizedByDate = (datas, from = "", to = "") => {
  const info = {
    title: "Loan Release",
  };

  const loanReleases = [];

  const formattedDatas = [];
  datas.map((data, i) => {
    data.principal = data.entries.reduce((acc, entry) => {
      if (loanCodes.includes(entry.acctCode.code)) acc += Number(entry?.debit || 0);
      return acc;
    }, 0);

    data.misc = data.entries.reduce((acc, entry) => {
      let code = entry.acctCode.code;
      if (!loanCodes.includes(code) && !bankCodes.includes(code)) acc += Number(entry?.credit || 0);
      return acc;
    }, 0);

    const fData = formattedDatas.findIndex(e => e.officer === data.acctOfficer);
    const monthYear = `${new Date(data.date).getMonth()} - ${new Date(data.date).getFullYear()}`;
    if (fData < 0) {
      formattedDatas.push({ officer: data.acctOfficer, months: [{ month: monthYear, datas: [data] }] });
    } else {
      const my = formattedDatas[fData].months.findIndex(e => e.month === monthYear);
      if (my < 0) formattedDatas[fData].months.push({ month: monthYear, datas: [data] });
      if (my >= 0) formattedDatas[fData].months[my].datas.push(data);
    }
  });

  let totalAmount = 0;
  let totalMisc = 0;
  let totalPrincipal = 0;

  formattedDatas.map(officer => {
    loanReleases.push([
      { text: `${officer.officer.toUpperCase()}`, bold: true, fontSize: 9, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      ...Array.from({ length: 13 }, () => ({ text: "", fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] })),
    ]);

    let oAmount = 0;
    let oMisc = 0;
    let oPrincipal = 0;

    officer.months.map(month => {
      let tAmount = 0;
      let tMisc = 0;
      let tPrincipal = 0;

      month.datas.map(data => {
        tAmount += Number(data.amount);
        tPrincipal += data.principal;
        tMisc += data.misc;

        loanReleases.push([
          { text: completeNumberDate(data.date), fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
          { text: `${data?.code}`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
          { text: `${data.center.centerNo} - ${data.center.description}`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
          { text: data.bank.description, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
          { text: data.checkNo, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
          { text: completeNumberDate(data.checkDate), fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
          { text: formatNumber(data.principal), fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
          { text: `0.00`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
          { text: `0.00`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
          { text: `0.00`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
          { text: `0.00`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
          { text: `0.00`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
          { text: formatNumber(data.misc), fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
          { text: formatNumber(data.amount), fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0], alignment: "right" },
        ]);
      });

      loanReleases.push([
        { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
        { text: `${formatNumber(tPrincipal)}`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
        { text: `0.00`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
        { text: `0.00`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
        { text: `0.00`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
        { text: `0.00`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
        { text: `0.00`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
        { text: `${formatNumber(tMisc)}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
        { text: `${formatNumber(tAmount)}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
      ]);
      loanReleases.push([...Array.from({ length: 14 }, () => ({ text: ``, fontSize: 8, margin: [0, 5, 0, 5], border: [0, 0, 0, 0] }))]);

      oAmount += tAmount;
      oMisc += tMisc;
      oPrincipal += tPrincipal;
    });

    loanReleases.push([
      { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
      { text: `${formatNumber(oPrincipal)}`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
      { text: `0.00`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
      { text: `0.00`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
      { text: `0.00`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
      { text: `0.00`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
      { text: `0.00`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
      { text: `${formatNumber(oMisc)}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
      { text: `${formatNumber(oAmount)}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    ]);
    loanReleases.push([...Array.from({ length: 14 }, () => ({ text: ``, fontSize: 8, margin: [0, 5, 0, 5], border: [0, 0, 0, 0] }))]);
    totalAmount += oAmount;
    totalMisc += oMisc;
    totalPrincipal += oPrincipal;
  });

  loanReleases.push([
    { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: ``, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 0, 0, 0] },
    { text: `${formatNumber(totalPrincipal)}`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `0.00`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `0.00`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `0.00`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `0.00`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `0.00`, fontSize: 8, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalMisc)}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalAmount)}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
  ]);
  loanReleases.push([...Array.from({ length: 14 }, () => ({ text: ``, fontSize: 8, margin: [0, 5, 0, 5], border: [0, 0, 0, 0] }))]);

  let title = "";
  if (from && !to) title = `Date From ${completeNumberDate(from)}`;
  if (to && !from) title = `Date To ${completeNumberDate(to)}`;
  if (to && from) title = `Date From ${completeNumberDate(from)} To ${completeNumberDate(to)}`;

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "Loan Release By Date ( Summarized )", fontSize: 9 },
    { text: title, fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["7%", "10%", "10%", "10%", "7%", "7%", "7%", "5%", "5%", "6%", "5%", "6.5%", "7%", "7%"],
        body: [
          [
            { text: "Date", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Doc. No.", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Center", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Bank", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Check No.", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Check Date", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Principal", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Interest", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "WSF", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Damayan", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "CGT", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Emergency", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Misc", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Amount", fontSize: 8, bold: true, margin: [0, 4.5, 0, 4.5], border: [0, 1, 0, 1], alignment: "right" },
          ],
          ...loanReleases,
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
    pageMargins: [10, 25, 10, 30],
    content: contents,
    styles: styles,
    defaultStyle: {
      font: "Roboto",
    },
  };
};
