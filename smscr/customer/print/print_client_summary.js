const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");

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

exports.printClientSummaryPDF = summaries => {
  const info = { title: "Client Summary" };

  let rows = [];

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
    { text: "Customer", style: "cellStyle", border: [0, 0], colSpan: 2 },
    {},
    { text: `${name}`, colSpan: 16, style: "cellStyle", border: [0, 0] },
    ...Array.from({ length: 15 }, () => ({})),
  ]);

  rows.push([
    { text: "Address", style: "cellStyle", border: [0, 0], colSpan: 2 },
    {},
    { text: `${address} ${city}`, colSpan: 16, style: "cellStyle", border: [0, 0] },
    ...Array.from({ length: 15 }, () => ({})),
  ]);

  rows.push([
    { text: "Center", style: "cellStyle", border: [0, 0], colSpan: 2 },
    {},
    { text: `${description} ${acctOfficer}`, colSpan: 16, style: "cellStyle", border: [0, 0] },
    ...Array.from({ length: 15 }, () => ({})),
  ]);

  rows.push([
    { text: "Account Number", style: "cellStyle", border: [0, 0], colSpan: 2 },
    {},
    { text: `${acctNumber}`, colSpan: 16, style: "cellStyle", border: [0, 0] },
    ...Array.from({ length: 15 }, () => ({})),
  ]);

  rows.push([
    { text: "Status", style: "cellStyle", border: [0, 0], colSpan: 2 },
    {},
    { text: `${memberStatus}`, colSpan: 16, style: "cellStyle", border: [0, 0] },
    ...Array.from({ length: 15 }, () => ({})),
  ]);

  rows.push([{ text: "", margin: [0, 5], border: [0, 0], colSpan: 18 }, ...Array.from({ length: 17 }, () => ({}))]);

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
      { text: `${centerNo}`, style: "cellStyle", border: [0, 0] },
      { text: `${name}`, style: "cellStyle", border: [0, 0] },
      { text: `${lr.code}`, style: "cellStyle", border: [0, 0] },
      { text: `${getCycle(loanrelease.lrs)}`, style: "cellStyle", border: [0, 0] },
      { text: `${completeNumberDate(lr.date)}`, style: "cellStyle", border: [0, 0] },
      { text: `${getMaturityDate(loanrelease.paymentschedules)}`, style: "cellStyle", border: [0, 0] },
      { text: `${lr.loan.code}`, style: "cellStyle", border: [0, 0] },
      { text: `${lr.noOfWeeks}`, style: "cellStyle", border: [0, 0] },
      { text: `${getPrincipal(loanrelease.lrs).formatted}`, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: ``, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: `${getTotalByCodes(loanrelease.ars, ["2000A", "2000B"]).formatted}`, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: `${getTotalBalance(loanrelease.lrs, loanrelease.ars).formatted}`, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: `${getTotalByCodes([...loanrelease.ors, ...loanrelease.ars], "4045").formatted}`, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: `${getTotalByCodes(loanrelease.ars, ["4052", "2010B"]).formatted}`, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: `${getTotalByCodes(loanrelease.ars, "2010A").formatted}`, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: `${getTotalByCodes(loanrelease.ars, "2010C").formatted}`, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: `${getTotalByCodes(loanrelease.ars, "2010D").formatted}`, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: `${getTotalCBU(loanrelease.ars).formatted}`, style: "cellStyle", border: [0, 0], alignment: "right" },
    ]);
  });

  journalvouchers.map(journal => {
    totalCGT -= Number(getTotalByCodes(journal.journals, ["4052", "2010B"]).original);
    totalUF -= Number(getTotalByCodes(journal.journals, "2010A").original);
    totalWSF -= Number(getTotalByCodes(journal.journals, "2010C").original);
    totalDF -= Number(getTotalByCodes(journal.journals, "2010D").original);
    totalCBU -= Number(getTotalCBU(journal.journals).original);

    rows.push([
      { text: `${centerNo}`, style: "cellStyle", border: [0, 0] },
      { text: `${name}`, style: "cellStyle", border: [0, 0] },
      { text: `${journal.journalVoucher.code}`, style: "cellStyle", border: [0, 0] },
      { text: ``, style: "cellStyle", border: [0, 0] },
      { text: `${completeNumberDate(journal.journalVoucher.date)}`, style: "cellStyle", border: [0, 0] },
      { text: ``, style: "cellStyle", border: [0, 0] },
      { text: ``, style: "cellStyle", border: [0, 0] },
      { text: ``, style: "cellStyle", border: [0, 0] },
      { text: ``, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: ``, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: ``, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: ``, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: ``, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: `(${getTotalByCodes(journal.journals, ["4052", "2010B"]).formatted})`, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: `(${getTotalByCodes(journal.journals, "2010A").formatted})`, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: `(${getTotalByCodes(journal.journals, "2010C").formatted})`, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: `(${getTotalByCodes(journal.journals, "2010D").formatted})`, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: `(${getTotalCBU(journal.journals).formatted}`, style: "cellStyle", border: [0, 0], alignment: "right" },
    ]);
  });

  expensevouchers.map(expense => {
    totalCGT -= Number(getTotalByCodes(expense.expenses, ["4052", "2010B"]).original);
    totalUF -= Number(getTotalByCodes(expense.expenses, "2010A").original);
    totalWSF -= Number(getTotalByCodes(expense.expenses, "2010C").original);
    totalDF -= Number(getTotalByCodes(expense.expenses, "2010D").original);
    totalCBU -= Number(getTotalCBU(expense.expenses).original);

    rows.push([
      { text: `${centerNo}`, style: "cellStyle", border: [0, 0] },
      { text: `${name}`, style: "cellStyle", border: [0, 0] },
      { text: `${expense.expenseVoucher.code}`, style: "cellStyle", border: [0, 0] },
      { text: ``, style: "cellStyle", border: [0, 0] },
      { text: `${completeNumberDate(expense.expenseVoucher.date)}`, style: "cellStyle", border: [0, 0] },
      { text: ``, style: "cellStyle", border: [0, 0] },
      { text: ``, style: "cellStyle", border: [0, 0] },
      { text: ``, style: "cellStyle", border: [0, 0] },
      { text: ``, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: ``, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: ``, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: ``, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: ``, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: `(${getTotalByCodes(expense.expenses, ["4052", "2010B"]).formatted})`, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: `(${getTotalByCodes(expense.expenses, "2010A").formatted})`, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: `(${getTotalByCodes(expense.expenses, "2010C").formatted})`, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: `(${getTotalByCodes(expense.expenses, "2010D").formatted})`, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: `(${getTotalCBU(expense.expenses).formatted}`, style: "cellStyle", border: [0, 0], alignment: "right" },
    ]);
  });

  damayanfunds.map(damayan => {
    totalCGT -= Number(getTotalByCodes(damayan.damayans, ["4052", "2010B"]).original);
    totalUF -= Number(getTotalByCodes(damayan.damayans, "2010A").original);
    totalWSF -= Number(getTotalByCodes(damayan.damayans, "2010C").original);
    totalDF -= Number(getTotalByCodes(damayan.damayans, "2010D").original);
    totalCBU -= Number(getTotalCBU(damayan.damayans).original);

    rows.push([
      { text: `${centerNo}`, style: "cellStyle", border: [0, 0] },
      { text: `${name}`, style: "cellStyle", border: [0, 0] },
      { text: `${damayan.damayanFund.code}`, style: "cellStyle", border: [0, 0] },
      { text: ``, style: "cellStyle", border: [0, 0] },
      { text: `${completeNumberDate(damayan.damayanFund.date)}`, style: "cellStyle", border: [0, 0] },
      { text: ``, style: "cellStyle", border: [0, 0] },
      { text: ``, style: "cellStyle", border: [0, 0] },
      { text: ``, style: "cellStyle", border: [0, 0] },
      { text: ``, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: ``, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: ``, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: ``, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: ``, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: `(${getTotalByCodes(damayan.damayans, ["4052", "2010B"]).formatted})`, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: `(${getTotalByCodes(damayan.damayans, "2010A").formatted})`, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: `(${getTotalByCodes(damayan.damayans, "2010C").formatted})`, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: `(${getTotalByCodes(damayan.damayans, "2010D").formatted})`, style: "cellStyle", border: [0, 0], alignment: "right" },
      { text: `(${getTotalCBU(damayan.damayans).formatted})`, style: "cellStyle", border: [0, 0], alignment: "right" },
    ]);
  });

  rows.push([{ text: "", margin: [0, 5], border: [0, 0], colSpan: 18 }, ...Array.from({ length: 17 }, () => ({}))]);

  rows.push([
    { text: ``, style: "cellStyle", border: [0, 0] },
    { text: ``, style: "cellStyle", border: [0, 0] },
    { text: ``, style: "cellStyle", border: [0, 0] },
    { text: ``, style: "cellStyle", border: [0, 0] },
    { text: ``, style: "cellStyle", border: [0, 0] },
    { text: ``, style: "cellStyle", border: [0, 0] },
    { text: ``, style: "cellStyle", border: [0, 0] },
    { text: ``, style: "cellStyle", border: [0, 0] },
    { text: `${formatNumber(totalPrincipal)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalBalanceOffset)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalPayment)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalBalance)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalInterest)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalCGT)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalUF)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalWSF)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalDF)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalCBU)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
  ]);

  rows.push([{ text: "", margin: [0, 5], border: [0, 0], colSpan: 18 }, ...Array.from({ length: 17 }, () => ({}))]);

  rows.push([
    { text: ``, style: "cellStyle", border: [0, 0] },
    { text: ``, style: "cellStyle", border: [0, 0] },
    { text: ``, style: "cellStyle", border: [0, 0] },
    { text: ``, style: "cellStyle", border: [0, 0] },
    { text: ``, style: "cellStyle", border: [0, 0] },
    { text: ``, style: "cellStyle", border: [0, 0] },
    { text: ``, style: "cellStyle", border: [0, 0] },
    { text: ``, style: "cellStyle", border: [0, 0] },
    { text: `${formatNumber(totalPrincipal)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalBalanceOffset)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalPayment)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalBalance)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalInterest)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalCGT)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalUF)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalWSF)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalDF)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalCBU)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
  ]);

  rows.push([{ text: "", margin: [0, 5], border: [0, 0], colSpan: 18 }, ...Array.from({ length: 17 }, () => ({}))]);
  rows.push([{ text: "", margin: [0, 5], border: [0, 0], colSpan: 18 }, ...Array.from({ length: 17 }, () => ({}))]);

  rows.push([
    { text: ``, style: "cellStyle", border: [0, 0] },
    { text: ``, style: "cellStyle", border: [0, 0] },
    { text: ``, style: "cellStyle", border: [0, 0] },
    { text: ``, style: "cellStyle", border: [0, 0] },
    { text: ``, style: "cellStyle", border: [0, 0] },
    { text: ``, style: "cellStyle", border: [0, 0] },
    { text: ``, style: "cellStyle", border: [0, 0] },
    { text: ``, style: "cellStyle", border: [0, 0] },
    { text: `${formatNumber(totalPrincipal)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalBalanceOffset)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalPayment)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalBalance)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalInterest)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalCGT)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalUF)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalWSF)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalDF)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(totalCBU)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
  ]);

  const contents = [
    { text: "KAALALAY FOUNDATION, INC. (LB)", fontSize: 10, bold: true },
    { text: "Loan Release By Client Summary ( Summary )", fontSize: 10, bold: true },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 10 },
    { text: "", margin: [0, 4] },
    {
      table: {
        widths: ["5.5%", "5.5%", "5.5%", "5.5%", "5.5%", "5.5%", "5.5%", "5.5%", "5.5%", "5.5%", "5.5%", "5.5%", "5.5%", "5.5%", "5.5%", "5.5%", "5.5%", "5.5%"],
        body: [
          [
            { text: "Center No.", style: "headerStyle", margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Name", style: "headerStyle", margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Ref. No", style: "headerStyle", margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Cycle", style: "headerStyle", margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Release Date", style: "headerStyle", margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Maturity Date", style: "headerStyle", margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Type of Loan", style: "headerStyle", margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Terms", style: "headerStyle", margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Principal", style: "headerStyle", margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Bal. Offset", style: "headerStyle", margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Payment", style: "headerStyle", margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Balance", style: "headerStyle", margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Interest", style: "headerStyle", margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
            { text: "CGT", style: "headerStyle", margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
            { text: "UF", style: "headerStyle", margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
            { text: "WSF", style: "headerStyle", margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
            { text: "DF", style: "headerStyle", margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Total CBU", style: "headerStyle", margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
          ],
          ...rows,
        ],
      },
    },
  ];

  const styles = {
    headerStyle: { fontSize: 8, bold: true },
    cellStyle: { fontSize: 8 },
  };

  const footer = function (currentPage, pageCount) {
    return {
      text: `Page ${currentPage} of ${pageCount}`,
      alignment: "right",
      fontSize: 8,
      margin: [0, 5, 10, 0],
    };
  };

  return {
    info: info,
    pageOrientation: "landscape",
    pageSize: "legal",
    footer: footer,
    pageMargins: [10, 15, 10, 15],
    content: contents,
    styles: styles,
    defaultStyle: {
      font: "Roboto",
    },
  };
};
