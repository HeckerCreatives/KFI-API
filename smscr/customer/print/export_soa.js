const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");
const XLSX = require("xlsx-js-style");

const setValue = (entries, code) => {
  code = typeof code === "string" ? [code] : code;
  const value = entries.find(e => code.includes(e.acctCode.code));
  return value ? formatNumber(value?.debit || value?.credit) : "";
};

const getValue = (entries, code) => {
  code = typeof code === "string" ? [code] : code;
  const value = entries.find(e => code.includes(e.acctCode.code));
  return Number(value ? value?.debit || value?.credit : 0);
};

exports.exportClientSOA = ({ payments, client, principal, loanRelease, signatures }) => {
  let topBottomBorder = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "none" }, right: { style: "none" } };

  const rows = [];

  rows.push([{ v: "STATEMENT OF ACCOUNT", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } }]);

  rows.push([]);

  rows.push([
    { v: "Name of Client", t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${client.name}`, t: "s", s: { alignment: { vertical: "center" } } },
  ]);

  rows.push([
    { v: "Address", t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${client.address}`, t: "s", s: { alignment: { vertical: "center" } } },
  ]);

  rows.push([
    { v: "Center No.", t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${client.center.centerNo}`, t: "s", s: { alignment: { vertical: "center" } } },
  ]);

  rows.push([
    { v: "Account No.", t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${client.acctNumber}`, t: "s", s: { alignment: { vertical: "center" } } },
  ]);

  rows.push([
    { v: "Cycle No.", t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${principal.cycle}`, t: "s", s: { alignment: { vertical: "center" } } },
  ]);

  rows.push([
    { v: "Type of Loan", t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${loanRelease?.loan?.description || ""} ${loanRelease.code}`, t: "s", s: { alignment: { vertical: "center" } } },
  ]);

  rows.push([
    { v: "Amount Loan", t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${formatNumber(principal?.debit || principal?.credit)}`, t: "s", s: { alignment: { vertical: "center" } } },
  ]);

  rows.push([
    { v: "Interest Rate", t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${loanRelease.interest}`, t: "s", s: { alignment: { vertical: "center" } } },
  ]);

  rows.push([
    { v: "Service Charge", t: "s", s: { alignment: { vertical: "center" } } },
    { v: "0.00", t: "s", s: { alignment: { vertical: "center" } } },
  ]);

  rows.push([
    { v: "Date Granted", t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${completeNumberDate(loanRelease.date)}`, t: "s", s: { alignment: { vertical: "center" } } },
  ]);

  rows.push([
    { v: "Maturity Date", t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${completeNumberDate(payments[payments.length - 1].date)}`, t: "s", s: { alignment: { vertical: "center" } } },
  ]);

  rows.push([]);

  rows.push([
    { v: "Collection Date", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Week No.", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: topBottomBorder } },
    { v: "OR No.", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "OR Date", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Total Payment", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "Principal Payment", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "Outstanding Balance", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "Interest Payment", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "WSF", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "Unity Fund", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  rows.push([
    { v: "PRINCIPAL AMOUNT", t: "s", s: { alignment: { vertical: "center" } } },
    { v: "", t: "s", s: { alignment: { vertical: "center" } } },
    { v: "", t: "s", s: { alignment: { vertical: "center" } } },
    { v: "", t: "s", s: { alignment: { vertical: "center" } } },
    { v: "", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: "", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: `${formatNumber(principal?.debit || principal?.credit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: "", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: "", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: "", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
  ]);

  let totalPrincipal = Number(principal?.credit || principal?.debit);

  let accTotal = 0;
  let accPrincipal = 0;
  let accInterest = 0;
  let accWSF = 0;

  payments.map(payment => {
    if (payment.ors.length > 0) {
      accInterest += getValue(payment.ors, "4045");
      rows.push([
        { v: `${completeNumberDate(payment.date)}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${payment.week}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${payment.ors[0].acknowledgement.code}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${completeNumberDate(payment.ors[0].acknowledgement.date)}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: "", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: "", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: "", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: `${setValue(payment.ors, "4045")}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: "", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: "", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      ]);
    }

    if (payment.ars.length > 0) {
      totalPrincipal -= getValue(payment.ars, ["2000B", "2000A"]);
      totalPayment = payment.ars.reduce((acc, obj) => acc + Number(obj?.debit || obj?.credit), 0);

      accTotal += Number(totalPayment);
      accPrincipal += getValue(payment.ars, ["2000B", "2000A"]);
      accInterest += getValue(payment.ars, "4045");
      accWSF += getValue(payment.ars, "2010C");

      rows.push([
        { v: `${completeNumberDate(payment.date)}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${payment.week}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${payment.ars[0].release.code}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${completeNumberDate(payment.ars[0].release.date)}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${formatNumber(totalPayment)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: `${setValue(payment.ars, ["2000B", "2000A"])}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: `${formatNumber(totalPrincipal)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: `${setValue(payment.ars, "4045")}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: `${setValue(payment.ars, "2010C")}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: "", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      ]);
    }

    if (payment.ars.length < 1 && payment.ors.length < 1) {
      rows.push([
        { v: `${completeNumberDate(payment.date)}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: `${payment.week}`, t: "s", s: { alignment: { vertical: "center" } } },
        { v: "", t: "s", s: { alignment: { vertical: "center" } } },
        { v: "", t: "s", s: { alignment: { vertical: "center" } } },
        { v: "", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: "", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: "", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: "", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: "", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
        { v: "", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      ]);
    }
  });

  rows.push([], []);

  rows.push([
    { v: "", t: "s", s: { alignment: { vertical: "center" } } },
    { v: "", t: "s", s: { alignment: { vertical: "center" } } },
    { v: "", t: "s", s: { alignment: { vertical: "center" } } },
    { v: "", t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${formatNumber(accTotal)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(accPrincipal)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: `${formatNumber(accInterest)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(accWSF)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: "", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
  ]);

  rows.push([], [], []);

  rows.push([
    { v: "PREPARED BY:", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "left" } } },
    { v: "", t: "s", s: { alignment: { vertical: "center" } } },
    { v: "CHECKED BY:", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: `${signatures.checkedBy}`, t: "s", s: { alignment: { vertical: "center", horizontal: "left" } } },
    { v: "", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: "NOTED BY:", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: `${signatures.approvedBy}`, t: "s", s: { alignment: { vertical: "center", horizontal: "left" } } },
    { v: "", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: "", t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
  ]);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows, { origin: "A2" });

  worksheet["!cols"] = Array.from(Array(14)).fill({ wch: 20 });

  XLSX.utils.sheet_add_aoa(worksheet, [], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Statement Of Account");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  return excelBuffer;
};
