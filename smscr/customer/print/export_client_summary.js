const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");
const XLSX = require("xlsx-js-style");

const getCycle = entries => {
  const codes = ["2000A", "2000B"];
  const entry = entries.find(e => codes.includes(e.acctCode.code));
  if (!entry) return "";
  return entry.cycle;
};

const getMaturityDate = schedules => {
  const weekNumbers = schedules.map(schedule => schedule.week);
  const lastWeek = Math.max(...weekNumbers);
  const schedule = schedules.find(e => e.week === lastWeek);
  if (!schedule) return "";
  return completeNumberDate(schedule.date);
};

const getTotalByCodes = (entries, codes) => {
  if (typeof codes === "string") codes = [codes];
  const total = entries.reduce((acc, obj) => {
    if (!codes.includes(obj.acctCode.code)) return acc;
    const amount = Number(!obj.debit || obj.debit === 0 ? obj.credit : obj.debit);
    return acc + amount;
  }, 0);

  return {
    formatted: formatNumber(total),
    original: total,
  };
};

const getPrincipal = entries => {
  const codes = ["2000A", "2000B"];
  const entry = entries.find(e => codes.includes(e.acctCode.code));
  if (!entry) return "";
  return {
    formatted: formatNumber(!entry.debit || entry.debit === 0 ? entry.credit : entry.debit),
    original: !entry.debit || entry.debit === 0 ? entry.credit : entry.debit,
  };
};

const getTotalBalance = (lrs, ars) => {
  const principal = getPrincipal(lrs).original;
  const totalPayment = getTotalByCodes(ars, ["2000A", "2000B"]).original;
  const total = Number(principal) - Number(totalPayment);
  return {
    formatted: formatNumber(total),
    original: total,
  };
};

const getTotalCBU = entries => {
  const totalCGT = getTotalByCodes(entries, ["4052", "2010B"]).original;
  const totalUF = getTotalByCodes(entries, "2010A").original;
  const totalWSF = getTotalByCodes(entries, "2010C").original;
  const totalDF = getTotalByCodes(entries, "2010D").original;

  const total = totalCGT + totalUF + totalWSF + totalDF;
  return {
    formatted: formatNumber(total),
    original: total,
  };
};

exports.exportClientSummaryExcel = summaries => {
  let topBottomBorder = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "none" }, right: { style: "none" } };
  const rows = [];

  rows.push([{ v: "KAALALAY FOUNDATION, INC. (LB)", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" } } }]);
  rows.push([{ v: "Loan Release By Client Summary ( Summary )", t: "s", s: { alignment: { vertical: "center" } } }]);
  rows.push([{ v: `Date Printed: ${completeNumberDate(new Date())}`, t: "s", s: { alignment: { vertical: "center" } } }]);
  rows.push([]);

  rows.push([
    { v: "Center No.", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Name", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Ref. No.", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Cycle", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Release Date", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Maturity Date", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Type Of Loan", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Terms", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Principal", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Balance Offset", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Payment", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Balance", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Interest", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "CGT", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "UF", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "WSF", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "DF", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
    { v: "Total CBU", t: "s", s: { font: { bold: true }, alignment: { vertical: "center" }, border: topBottomBorder } },
  ]);

  const {
    name,
    address,
    city,
    center: { description, acctOfficer, centerNo },
    acctNumber,
    memberStatus,
    loanReleases,
    journalvouchers,
    expensevouchers,
    damayanfunds,
    emergencyloans,
  } = summaries[0];

  rows.push([
    { v: `Customer`, t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${name}`, t: "s", s: { alignment: { vertical: "center" } } },
  ]);

  rows.push([
    { v: `Address`, t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${address} ${city}`, t: "s", s: { alignment: { vertical: "center" } } },
  ]);

  rows.push([
    { v: `Center`, t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${description} ${acctOfficer}`, t: "s", s: { alignment: { vertical: "center" } } },
  ]);

  rows.push([
    { v: `Account No.`, t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${acctNumber}`, t: "s", s: { alignment: { vertical: "center" } } },
  ]);

  rows.push([
    { v: `Status`, t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${memberStatus}`, t: "s", s: { alignment: { vertical: "center" } } },
  ]);

  rows.push([]);

  let totalPrincipal = 0;
  let totalBalanceOffset = 0;
  let totalPayment = 0;
  let totalBalance = 0;
  let totalInterest = 0;
  let totalCGT = 0;
  let totalUF = 0;
  let totalWSF = 0;
  let totalDF = 0;
  let totalCBU = 0;

  loanReleases.map(loanrelease => {
    const lr = loanrelease.loanRelease;

    totalPrincipal += Number(getPrincipal(loanrelease.lrs).original);
    totalBalanceOffset += 0;
    totalPayment += Number(getTotalByCodes(loanrelease.ars, ["2000A", "2000B"]).original);
    totalBalance += Number(getTotalBalance(loanrelease.lrs, loanrelease.ars).original);
    totalInterest += Number(getTotalByCodes([...loanrelease.ors, ...loanrelease.ars], "4045").original);
    totalCGT += Number(getTotalByCodes(loanrelease.ars, ["4052", "2010B"]).original);
    totalUF += Number(getTotalByCodes(loanrelease.ars, "2010A").original);
    totalWSF += Number(getTotalByCodes(loanrelease.ars, "2010C").original);
    totalDF += Number(getTotalByCodes(loanrelease.ars, "2010D").original);
    totalCBU += Number(getTotalCBU(loanrelease.ars).original);

    rows.push([
      { v: `${centerNo}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${name}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${lr.code}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${getCycle(loanrelease.lrs)}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${completeNumberDate(lr.date)}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${getMaturityDate(loanrelease.paymentschedules)}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${lr.loan.code}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${lr.noOfWeeks}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${getPrincipal(loanrelease.lrs).formatted}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${getTotalByCodes(loanrelease.ars, ["2000A", "2000B"]).formatted}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${getTotalBalance(loanrelease.lrs, loanrelease.ars).formatted}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${getTotalByCodes([...loanrelease.ors, ...loanrelease.ars], "4045").formatted}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${getTotalByCodes(loanrelease.ars, ["4052", "2010B"]).formatted}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${getTotalByCodes(loanrelease.ars, "2010A").formatted}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${getTotalByCodes(loanrelease.ars, "2010C").formatted}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${getTotalByCodes(loanrelease.ars, "2010D").formatted}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${getTotalCBU(loanrelease.ars).formatted}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    ]);
  });

  journalvouchers.map(journal => {
    totalCGT -= Number(getTotalByCodes(journal.journals, ["4052", "2010B"]).original);
    totalUF -= Number(getTotalByCodes(journal.journals, "2010A").original);
    totalWSF -= Number(getTotalByCodes(journal.journals, "2010C").original);
    totalDF -= Number(getTotalByCodes(journal.journals, "2010D").original);
    totalCBU -= Number(getTotalCBU(journal.journals).original);

    rows.push([
      { v: `${centerNo}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${name}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${journal.journalVoucher.code}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${completeNumberDate(journal.journalVoucher.date)}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `(${getTotalByCodes(journal.journals, ["4052", "2010B"]).formatted})`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `(${getTotalByCodes(journal.journals, "2010A").formatted})`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `(${getTotalByCodes(journal.journals, "2010C").formatted})`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `(${getTotalByCodes(journal.journals, "2010D").formatted})`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `(${getTotalCBU(journal.journals).formatted})`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    ]);
  });

  expensevouchers.map(expense => {
    totalCGT -= Number(getTotalByCodes(expense.expenses, ["4052", "2010B"]).original);
    totalUF -= Number(getTotalByCodes(expense.expenses, "2010A").original);
    totalWSF -= Number(getTotalByCodes(expense.expenses, "2010C").original);
    totalDF -= Number(getTotalByCodes(expense.expenses, "2010D").original);
    totalCBU -= Number(getTotalCBU(expense.expenses).original);

    rows.push([
      { v: `${centerNo}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${name}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${expense.expenseVoucher.code}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${completeNumberDate(expense.expenseVoucher.date)}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `(${getTotalByCodes(expense.expenses, ["4052", "2010B"]).formatted})`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `(${getTotalByCodes(expense.expenses, "2010A").formatted})`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `(${getTotalByCodes(expense.expenses, "2010C").formatted})`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `(${getTotalByCodes(expense.expenses, "2010D").formatted})`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `(${getTotalCBU(expense.expenses).formatted})`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    ]);
  });

  damayanfunds.map(damayan => {
    totalCGT -= Number(getTotalByCodes(damayan.damayans, ["4052", "2010B"]).original);
    totalUF -= Number(getTotalByCodes(damayan.damayans, "2010A").original);
    totalWSF -= Number(getTotalByCodes(damayan.damayans, "2010C").original);
    totalDF -= Number(getTotalByCodes(damayan.damayans, "2010D").original);
    totalCBU -= Number(getTotalCBU(damayan.damayans).original);

    rows.push([
      { v: `${centerNo}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${name}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${damayan.damayanFund.code}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: `${completeNumberDate(damayan.damayanFund.date)}`, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `(${getTotalByCodes(damayan.damayans, ["4052", "2010B"]).formatted})`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `(${getTotalByCodes(damayan.damayans, "2010A").formatted})`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `(${getTotalByCodes(damayan.damayans, "2010C").formatted})`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `(${getTotalByCodes(damayan.damayans, "2010D").formatted})`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `(${getTotalCBU(damayan.damayans).formatted})`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    ]);
  });

  rows.push([]);
  rows.push([
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${formatNumber(totalPrincipal)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalBalanceOffset)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalPayment)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalBalance)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalInterest)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalCGT)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalUF)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalWSF)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalDF)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalCBU)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  rows.push([]);
  rows.push([
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${formatNumber(totalPrincipal)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalBalanceOffset)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalPayment)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalBalance)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalInterest)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalCGT)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalUF)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalWSF)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalDF)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalCBU)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  rows.push([]);
  rows.push([]);
  rows.push([
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: ``, t: "s", s: { alignment: { vertical: "center" } } },
    { v: `${formatNumber(totalPrincipal)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalBalanceOffset)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalPayment)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalBalance)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalInterest)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalCGT)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalUF)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalWSF)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalDF)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
    { v: `${formatNumber(totalCBU)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: topBottomBorder } },
  ]);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows, { origin: "A1" });

  worksheet["!cols"] = Array.from(Array(14)).fill({ wch: 20 });

  XLSX.utils.sheet_add_aoa(worksheet, [], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Client Summary");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  return excelBuffer;
};
