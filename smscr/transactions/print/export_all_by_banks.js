const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");
const XLSX = require("xlsx-js-style");

exports.exportAllByBanks = datas => {
  const formattedLoanReleases = [];
  let totalAmount = 0;

  let topBottomBorder = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "none" }, right: { style: "none" } };

  formattedLoanReleases.push([
    { v: "Check Date", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Check No.", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Doc. No.", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Client", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Particulars", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Amount", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  datas.map((data, i) => {
    formattedLoanReleases.push([
      { v: "Bank:", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: `${data.code} - ${data.description}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
    ]);

    let totalPerBank = 0;

    data.transactions.map(transaction => {
      totalAmount += Number(transaction.amount);
      totalPerBank += Number(transaction.amount);

      formattedLoanReleases.push([
        { v: `${completeNumberDate(transaction.checkDate)}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${transaction?.checkNo || ""}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${transaction.code}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${transaction.center.centerNo} - ${transaction.center.description}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${transaction?.remarks || ""}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${formatNumber(transaction.amount)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      ]);
    });

    formattedLoanReleases.push([
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `Bank Sub Total: `, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${formatNumber(totalPerBank)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    ]);

    formattedLoanReleases.push(Array.from({ length: 6 }, () => ({ v: ``, t: "s", s: { alignment: { vertical: "center" } } })));
  });

  formattedLoanReleases.push([
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: `${formatNumber(totalAmount)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(formattedLoanReleases, { origin: "A7" });

  worksheet["!cols"] = Array.from(Array(14)).fill({ wch: 20 });

  let title = "";

  const headerTitle = "KAALALAY FOUNDATION, INC. (LB)";
  const headerSubtitle = `Loan Release By Banks`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [title], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Loan Release");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  return excelBuffer;
};
