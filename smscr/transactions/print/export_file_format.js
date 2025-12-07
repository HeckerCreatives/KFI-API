const { loanCodes } = require("../../../constants/loan-codes");
const { formatNumber } = require("../../../utils/number");
const XLSX = require("xlsx-js-style");
const wsfService = require("../../weekly-saving/weekly-saving.service");
const Entry = require("../entries/entry.schema");
const { completeNumberDate } = require("../../../utils/date");

exports.loanReleaseExportFormat2File = async (loanRelease, payTo, entries) => {
  let particulars = "";
  let loans = [];
  let accountEntries = [];
  let totalDebit = 0;
  let totalCredit = 0;
  let totalAmount = Number(loanRelease.amount);

  if (loanRelease.remarks) particulars += `${loanRelease.remarks}\n`;
  entries.map(async entry => {
    // if (entry.particular) particulars += `${entry.particular}\n`;
    if (entry.client) totalAmount -= Number(entry.credit);

    totalDebit += Number(entry.debit) || 0;
    totalCredit += Number(entry.credit) || 0;

    const isAdded = accountEntries.findIndex(e => e.code === entry.acctCode.code);
    const isLoanAdded = loans.findIndex(e => entry.client && e.client === entry.client.name);

    if (isLoanAdded >= 0) {
      if (entry.client && !loans[isLoanAdded].client) {
        loans[isLoanAdded].client = entry.client.name;
        loans[isLoanAdded].bankAccountNo = entry.client.bankAccountNo || "";
        loans[isLoanAdded].business = entry.client.business.type;
        loans[isLoanAdded].checkNo = loanRelease.checkNo;
      }
      if (loanCodes.includes(entry.acctCode.code)) {
        loans[isLoanAdded].amountApproved = entry.debit;
        loans[isLoanAdded].accountCode = entry.acctCode._id;
        loans[isLoanAdded].cycle = entry.cycle || 0;
      }
      if (entry.acctCode.code === "2011") loans[isLoanAdded].legalFee = entry.credit;
      if (entry.acctCode.code === "2009") loans[isLoanAdded].insurancePremium = entry.credit;
      if (entry.acctCode.code === "4050") loans[isLoanAdded].serviceCharge = entry.credit;
      if (entry.acctCode.code === "2010A") loans[isLoanAdded].unityFund = entry.credit;
      if (entry.acctCode.code === "2009G") loans[isLoanAdded].insuranceKSB = entry.credit;
    }

    if (isLoanAdded < 0) {
      if (entry.client) {
        const newEntry = {
          client: entry.client.name,
          bankAccountNo: entry.client.bankAccountNo || "",
          clientId: entry.client._id,
          business: entry.client.business.type,
          checkNo: loanRelease.checkNo,
        };
        if (loanCodes.includes(entry.acctCode.code)) {
          newEntry.accountCode = entry.acctCode._id;
          newEntry.amountApproved = entry.debit;
          newEntry.cycle = entry.cycle || 0;
        }
        if (entry.acctCode.code === "2011") newEntry.legalFee = entry.credit;
        if (entry.acctCode.code === "2009") newEntry.insurancePremium = entry.credit;
        if (entry.acctCode.code === "4050") newEntry.serviceCharge = entry.credit;
        if (entry.acctCode.code === "2010A") newEntry.unityFund = entry.credit;
        if (entry.acctCode.code === "2009G") newEntry.insuranceKSB = entry.credit;
        loans.push(newEntry);
      }
    }

    if (isAdded < 0) {
      accountEntries.push({
        code: entry.acctCode.code,
        description: entry.acctCode.description,
        debit: Number(entry.debit) || 0,
        credit: Number(entry.credit) || 0,
      });
    }

    if (isAdded >= 0) {
      accountEntries[isAdded].debit += Number(entry.debit) || 0;
      accountEntries[isAdded].credit += Number(entry.credit) || 0;
    }
  });

  await Promise.all(
    loans.map(async (loan, i) => {
      const wsf = await wsfService.get_value_by_amount(loan.amountApproved);
      const interest = loan.amountApproved * (loanRelease.interest / 100);
      const totalPayment = (interest + loan.amountApproved + wsf.weeklySaving.weeklySavingsFund) / loanRelease.noOfWeeks;
      const weeklyAmortization = totalPayment + Math.ceil(loan.amountApproved / 1000) * 10;
      const totalDeductions = loan.serviceCharge + loan.unityFund + loan.insurancePremium + loan.insuranceKSB + loan.legalFee;
      const netLoan = loan.amountApproved - totalDeductions;

      loans[i].weeklyAmortization = weeklyAmortization;
      loans[i].totalDeductions = totalDeductions;
      loans[i].netLoan = netLoan;

      const prevLoan = await Entry.find({ client: loan.clientId, cycle: { $ne: "" } })
        .sort({ cycle: -1 })
        .limit(2)
        .lean()
        .exec();

      if (prevLoan.length > 1) {
        loans[i].previousAmount = prevLoan[0].debit;
      } else {
        loans[i].previousAmount = "";
      }
    })
  );

  const fullBorder = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };

  const botBorder = {
    bottom: { style: "thin", color: { rgb: "000000" } },
  };

  let datas = [
    [
      {
        v: "KAALALAY FOUNDATION, INC (LB)",
        t: "s",
        s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } },
        merge: { cols: 18 },
      },
    ],
    [{ v: "LOAN RELEASE FORM", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } }, merge: { cols: 18 } }],
    [{ v: "" }],
    [
      { v: "CENTER NUMBER AND LOCATION", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "left" } } },
      { v: "" },
      { v: "" },
      { v: `${payTo}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "left" }, border: botBorder } },
      { v: "", s: { border: botBorder } },
      { v: "", s: { border: botBorder } },
      { v: "" },
      { v: "" },
      { v: "DOCUMENT NO", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "left" } } },
      { v: "" },
      { v: `${loanRelease.code}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "left" }, border: botBorder } },
      { v: "", s: { border: botBorder } },
      { v: "", s: { border: botBorder } },
    ],
    [
      { v: "WEEKLY MEETING SCHEDULE", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "left" } } },
      { v: "" },
      { v: "" },
      { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "left" }, border: botBorder } },
      { v: "", s: { border: botBorder } },
      { v: "", s: { border: botBorder } },
      { v: "" },
      { v: "" },
      { v: "BANK", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "left" } } },
      { v: "" },
      { v: `${loanRelease.bank.description}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "left" }, border: botBorder } },
      { v: "", s: { border: botBorder } },
      { v: "", s: { border: botBorder } },
    ],
    [
      { v: "DATE OF RELEASE", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "left" } } },
      { v: "" },
      { v: "" },
      { v: `${completeNumberDate(loanRelease.date)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "left" }, border: botBorder } },
      { v: "", s: { border: botBorder } },
      { v: "", s: { border: botBorder } },
      { v: "" },
      { v: "" },
      { v: "CHECK NO", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "left" } } },
      { v: "" },
      { v: `${loanRelease.checkNo}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "left" }, border: botBorder } },
      { v: "", s: { border: botBorder } },
      { v: "", s: { border: botBorder } },
    ],
  ];

  datas.push([{ v: "" }]);

  datas.push([
    { v: "No", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center", wrapText: true }, border: fullBorder } },
    { v: "Group", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center", wrapText: true }, border: fullBorder } },
    { v: "Name", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center", wrapText: true }, border: fullBorder } },
    { v: "Cycle", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center", wrapText: true }, border: fullBorder } },
    { v: "Bank Account No", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center", wrapText: true }, border: fullBorder } },
    { v: "Loan Amt Prev Cycle", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center", wrapText: true }, border: fullBorder } },
    { v: "Loan Amt Approved", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center", wrapText: true }, border: fullBorder } },
    { v: "Weekly Amortization", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center", wrapText: true }, border: fullBorder } },
    { v: "DEDUCTION FROM PRESENT LOAN", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center", wrapText: true }, border: fullBorder } },
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
    { v: "Total Deductions", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center", wrapText: true }, border: fullBorder } },
    { v: "Net Loan Proceeds", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center", wrapText: true }, border: fullBorder } },
    { v: "Check No", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center", wrapText: true }, border: fullBorder } },
    { v: "Signature", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center", wrapText: true }, border: fullBorder } },
  ]);

  datas.push([
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
    { v: "Service Charge 2%", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center", wrapText: true }, border: fullBorder } },
    { v: "Unity Fund 5%", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center", wrapText: true }, border: fullBorder } },
    { v: "Insurance Premium", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center", wrapText: true }, border: fullBorder } },
    { v: "Notarial Fee", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center", wrapText: true }, border: fullBorder } },
    { v: "Insurance KSB", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center", wrapText: true }, border: fullBorder } },
    { v: "ID", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center", wrapText: true }, border: fullBorder } },
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
  ]);

  datas.push([{ v: "" }]);

  loans.map((loan, i) => {
    datas.push([
      { v: `${i + 1}`, t: "s", s: { alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
      { v: `${loan.client}`, t: "s", s: { alignment: { vertical: "center", horizontal: "left" }, border: fullBorder } },
      { v: `${loan.cycle}`, t: "s", s: { alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
      { v: `${loan.bankAccountNo}`, t: "s", s: { alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
      { v: `${formatNumber(loan.previousAmount)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: `${formatNumber(loan.amountApproved)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: `${formatNumber(loan.weeklyAmortization)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: `${formatNumber(loan.serviceCharge)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: `${formatNumber(loan.unityFund)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: `${formatNumber(loan.insurancePremium)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: `${formatNumber(loan.legalFee)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: `${formatNumber(loan.insuranceKSB)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: `${formatNumber(loan.totalDeductions)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: `${formatNumber(loan.netLoan)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: `${loan.checkNo}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
    ]);
  });

  datas.push([
    { v: `` },
    { v: `` },
    { v: `` },
    { v: `` },
    { v: `` },
    { v: `Total: `, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: `${formatNumber(loans.reduce((acc, obj) => acc + obj.amountApproved, 0))}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: `${formatNumber(loans.reduce((acc, obj) => acc + obj.weeklyAmortization, 0))}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: `${formatNumber(loans.reduce((acc, obj) => acc + obj.serviceCharge, 0))}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: `${formatNumber(loans.reduce((acc, obj) => acc + obj.unityFund, 0))}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: `${formatNumber(loans.reduce((acc, obj) => acc + obj.insurancePremium, 0))}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: `${formatNumber(loans.reduce((acc, obj) => acc + obj.legalFee, 0))}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: `${formatNumber(loans.reduce((acc, obj) => acc + obj.insuranceKSB, 0))}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: `` },
    { v: `${formatNumber(loans.reduce((acc, obj) => acc + obj.totalDeductions, 0))}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: `${formatNumber(loans.reduce((acc, obj) => acc + obj.amountApproved, 0))}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: `` },
    { v: `` },
  ]);

  datas.push([{ v: "" }]);

  accountEntries.map((entry, i) => {
    datas.push([
      { v: `${loans.length + (i + 1)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
      { v: `${entry.code} - ${entry.description}`, t: "s", s: { alignment: { vertical: "center", horizontal: "left", wrapText: true }, border: fullBorder } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
      { v: `${formatNumber(entry.debit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: `${formatNumber(entry.credit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
      { v: ``, t: "s", s: { alignment: { vertical: "center", horizontal: "right" }, border: fullBorder } },
    ]);
  });

  datas.push([
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
    { v: `Total:  ${formatNumber(totalDebit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    { v: `${formatNumber(totalDebit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
  ]);

  datas.push([{ v: "" }], [{ v: "" }], [{ v: "" }]);

  datas.push(
    [
      { v: "PREPARED BY:", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "" },

      { v: "CHECKED BY:", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "" },

      { v: "APPROVED BY:", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "" },

      { v: "RECEIVED BY/DATE:", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
    ],
    [
      { v: `${loanRelease.preparedBy}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "" },

      { v: `${loanRelease.checkedBy}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "" },

      { v: `${loanRelease.approvedBy}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "" },

      { v: `${loanRelease.receivedBy}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
    ]
  );

  const merges = [];

  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 18 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 18 } });

  merges.push(
    { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } },
    { s: { r: 3, c: 3 }, e: { r: 3, c: 5 } },
    { s: { r: 3, c: 8 }, e: { r: 3, c: 9 } },
    { s: { r: 3, c: 10 }, e: { r: 3, c: 12 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } },
    { s: { r: 4, c: 3 }, e: { r: 4, c: 5 } },
    { s: { r: 4, c: 8 }, e: { r: 4, c: 9 } },
    { s: { r: 4, c: 10 }, e: { r: 4, c: 12 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 2 } },
    { s: { r: 5, c: 3 }, e: { r: 5, c: 5 } },
    { s: { r: 5, c: 8 }, e: { r: 5, c: 9 } },
    { s: { r: 5, c: 10 }, e: { r: 5, c: 12 } }
  );

  merges.push(
    { s: { r: 7, c: 8 }, e: { r: 7, c: 13 } },
    { s: { r: 7, c: 0 }, e: { r: 8, c: 0 } },
    { s: { r: 7, c: 1 }, e: { r: 8, c: 1 } },
    { s: { r: 7, c: 2 }, e: { r: 8, c: 2 } },
    { s: { r: 7, c: 3 }, e: { r: 8, c: 3 } },
    { s: { r: 7, c: 4 }, e: { r: 8, c: 4 } },
    { s: { r: 7, c: 5 }, e: { r: 8, c: 5 } },
    { s: { r: 7, c: 6 }, e: { r: 8, c: 6 } },
    { s: { r: 7, c: 7 }, e: { r: 8, c: 7 } }
  );

  merges.push(
    { s: { r: 7, c: 14 }, e: { r: 8, c: 14 } },
    { s: { r: 7, c: 15 }, e: { r: 8, c: 15 } },
    { s: { r: 7, c: 16 }, e: { r: 8, c: 16 } },
    { s: { r: 7, c: 17 }, e: { r: 8, c: 17 } }
  );

  let noteRow = loans.length + accountEntries.length + 16;
  let nameRow = noteRow + 1;

  merges.push(
    { s: { r: noteRow, c: 0 }, e: { r: noteRow, c: 2 } },
    { s: { r: noteRow, c: 4 }, e: { r: noteRow, c: 6 } },
    { s: { r: noteRow, c: 8 }, e: { r: noteRow, c: 11 } },
    { s: { r: noteRow, c: 13 }, e: { r: noteRow, c: 17 } },
    { s: { r: nameRow, c: 0 }, e: { r: nameRow, c: 2 } },
    { s: { r: nameRow, c: 4 }, e: { r: nameRow, c: 6 } },
    { s: { r: nameRow, c: 8 }, e: { r: nameRow, c: 11 } },
    { s: { r: nameRow, c: 13 }, e: { r: nameRow, c: 17 } }
  );

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(datas, { origin: "A1" });

  ws["!merges"] = merges;

  ws["!cols"] = [
    { wch: 6 },
    { wch: 6 },
    { wch: 30 },
    { wch: 6 },
    { wch: 30 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 6 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Loan Release");

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

  return excelBuffer;
};
