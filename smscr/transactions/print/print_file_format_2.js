const { loanCodes } = require("../../../constants/loan-codes");
const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");
const wsfService = require("../../weekly-saving/weekly-saving.service");
const Entry = require("../entries/entry.schema");

exports.loanReleasePrintFormat2File = async (payTo, loanRelease, entries) => {
  const info = { title: "Loan Release" };

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
        const newEntry = { client: entry.client.name, clientId: entry.client._id, business: entry.client.business.type, checkNo: loanRelease.checkNo };
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

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true, alignment: "center" },
    { text: "LOAN RELEASE FORM", fontSize: 9, bold: true, alignment: "center", margin: [0, 10, 0, 10] },
    {
      margin: [0, 5, 0, 5],
      table: {
        widths: ["*", "*"],
        body: [
          [
            {
              border: [0, 0, 0, 0],
              table: {
                widths: ["35%", "*"],
                body: [
                  [
                    { text: "CENTER NO. AND LOCATION", fontSize: 9, border: [0, 0, 0, 0] },
                    { text: `${payTo}`, fontSize: 9, border: [0, 0, 0, 1] },
                  ],
                  [
                    { text: "WEEKLY CENTER MEETING SCHEDULE", fontSize: 9, border: [0, 0, 0, 0] },
                    { text: "", fontSize: 9, border: [0, 0, 0, 1] },
                  ],
                  [
                    { text: "DATE OF RELEASE", fontSize: 9, border: [0, 0, 0, 0] },
                    { text: `${completeNumberDate(loanRelease.date)}`, fontSize: 9, border: [0, 0, 0, 1] },
                  ],
                ],
              },
            },
            {
              border: [0, 0, 0, 0],
              table: {
                widths: ["16%", "*"],
                body: [
                  [
                    { text: "DOCUMENT NO", fontSize: 9, border: [0, 0, 0, 0] },
                    { text: `${loanRelease.code}`, fontSize: 9, border: [0, 0, 0, 1] },
                  ],
                  [
                    { text: "BANK", fontSize: 9, border: [0, 0, 0, 0] },
                    { text: `${loanRelease.bank.description}`, fontSize: 9, border: [0, 0, 0, 1] },
                  ],
                  [
                    { text: "CHECK NO", fontSize: 9, border: [0, 0, 0, 0] },
                    { text: `${loanRelease.checkNo}`, fontSize: 9, border: [0, 0, 0, 1] },
                  ],
                ],
              },
            },
          ],
        ],
      },
    },
    {
      margin: [10, 0, 5, 0],
      table: {
        widths: ["auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto"],
        body: [
          [
            { text: "No", rowSpan: 2, fontSize: 8, margin: [0, 15, 0, 0], alignment: "center" },
            { text: "Group", rowSpan: 2, fontSize: 8, margin: [0, 15, 0, 0], alignment: "center" },
            { text: "Name", rowSpan: 2, fontSize: 8, margin: [0, 15, 0, 0], alignment: "center" },
            { text: "Cycle", rowSpan: 2, fontSize: 8, margin: [0, 15, 0, 0], alignment: "center" },
            { text: "Project", rowSpan: 2, fontSize: 8, margin: [0, 15, 0, 0], alignment: "center" },
            { text: "Loan Amt Prev Cycle", rowSpan: 2, fontSize: 8, margin: [0, 10, 0, 0], alignment: "center" },
            { text: "Loan Amt Approved", rowSpan: 2, fontSize: 8, margin: [0, 10, 0, 0], alignment: "center" },
            { text: "Weekly Amortization", rowSpan: 2, fontSize: 8, margin: [0, 10, 0, 0], alignment: "center" },
            { text: "DEDUCTION FROM PRESENT LOAN", colSpan: 6, fontSize: 8, margin: [0, 0, 0, 0], alignment: "center" },
            {},
            {},
            {},
            {},
            {},
            { text: "Total Deductions", rowSpan: 2, fontSize: 8, margin: [0, 10, 0, 0], alignment: "center" },
            { text: "Net Loan Proceeds", rowSpan: 2, fontSize: 8, margin: [0, 10, 0, 0], alignment: "center" },
            { text: "Check No.", rowSpan: 2, fontSize: 8, margin: [0, 10, 0, 0], alignment: "center" },
            { text: "Signature", rowSpan: 2, fontSize: 8, margin: [0, 15, 0, 0], alignment: "center" },
          ],
          [
            {},
            {},
            {},
            {},
            {},
            {},
            {},
            {},
            { text: "Service Charge 2%", fontSize: 8, margin: [0, 5, 0, 0], alignment: "center" },
            { text: "Unity Fund 5%", fontSize: 8, margin: [0, 5, 0, 0], alignment: "center" },
            { text: "Insurance Premium", fontSize: 8, margin: [0, 5, 0, 0], alignment: "center" },
            { text: "Notarial Fee", fontSize: 8, margin: [0, 5, 0, 0], alignment: "center" },
            { text: "Insurance KSB", fontSize: 8, margin: [0, 5, 0, 0], alignment: "center" },
            { text: "ID", fontSize: 8, margin: [0, 8, 0, 0], alignment: "center" },
            {},
            {},
            {},
            {},
          ],
          Array.from({ length: 18 }).fill({ text: "", border: [0, 0, 0, 0], margin: [0, 3, 0, 3] }),
          ...loans.map((loan, i) => [
            { text: `${i + 1}`, fontSize: 8, margin: [0, 5, 0, 0], alignment: "center" },
            { text: "", fontSize: 8, margin: [0, 5, 0, 0], alignment: "center" },
            { text: `${loan.client}`, fontSize: 8, margin: [0, 5, 0, 0] },
            { text: `${loan.cycle}`, fontSize: 8, margin: [0, 5, 0, 0], alignment: "center" },
            { text: `${loan.business}`, fontSize: 8, margin: [0, 5, 0, 0], alignment: "center" },
            { text: `${formatNumber(loan.previousAmount)}`, fontSize: 8, margin: [0, 5, 0, 0], alignment: "right" },
            { text: `${formatNumber(loan.amountApproved)}`, fontSize: 8, margin: [0, 5, 0, 0], alignment: "right" },
            { text: `${formatNumber(loan.weeklyAmortization)}`, fontSize: 8, margin: [0, 5, 0, 0], alignment: "right" },
            { text: `${formatNumber(loan.serviceCharge)}`, fontSize: 8, margin: [0, 5, 0, 0], alignment: "right" },
            { text: `${formatNumber(loan.unityFund)}`, fontSize: 8, margin: [0, 5, 0, 0], alignment: "right" },
            { text: `${formatNumber(loan.insurancePremium)}`, fontSize: 8, margin: [0, 5, 0, 0], alignment: "right" },
            { text: `${formatNumber(loan.legalFee)}`, fontSize: 8, margin: [0, 5, 0, 0], alignment: "right" },
            { text: `${formatNumber(loan.insuranceKSB)}`, fontSize: 8, margin: [0, 5, 0, 0], alignment: "right" },
            { text: "", fontSize: 8, margin: [0, 5, 0, 0], alignment: "center" },
            { text: `${formatNumber(loan.totalDeductions)}`, fontSize: 8, margin: [0, 5, 0, 0], alignment: "right" },
            { text: `${formatNumber(loan.netLoan)}`, fontSize: 8, margin: [0, 5, 0, 0], alignment: "right" },
            { text: `${loan.checkNo}`, fontSize: 8, margin: [0, 5, 0, 0], alignment: "center" },
            { text: "", fontSize: 8, margin: [0, 5, 0, 0], alignment: "center" },
          ]),
          [
            { text: "", border: [0, 0, 0, 0] },
            { text: "", border: [0, 0, 0, 0] },
            { text: "", border: [0, 0, 0, 0] },
            { text: "", border: [0, 0, 0, 0] },
            { text: "", border: [0, 0, 0, 0] },
            { text: "Total:", border: [0, 0, 0, 0], fontSize: 8, alignment: "right" },
            { text: `${formatNumber(loans.reduce((acc, obj) => acc + obj.amountApproved, 0))}`, border: [0, 0, 0, 0], fontSize: 8, alignment: "right" },
            { text: `${formatNumber(loans.reduce((acc, obj) => acc + obj.weeklyAmortization, 0))}`, border: [0, 0, 0, 0], fontSize: 8, alignment: "right" },
            { text: `${formatNumber(loans.reduce((acc, obj) => acc + obj.serviceCharge, 0))}`, border: [0, 0, 0, 0], fontSize: 8, alignment: "right" },
            { text: `${formatNumber(loans.reduce((acc, obj) => acc + obj.unityFund, 0))}`, border: [0, 0, 0, 0], fontSize: 8, alignment: "right" },
            { text: `${formatNumber(loans.reduce((acc, obj) => acc + obj.insurancePremium, 0))}`, border: [0, 0, 0, 0], fontSize: 8, alignment: "right" },
            { text: `${formatNumber(loans.reduce((acc, obj) => acc + obj.legalFee, 0))}`, border: [0, 0, 0, 0], fontSize: 8, alignment: "right" },
            { text: `${formatNumber(loans.reduce((acc, obj) => acc + obj.insuranceKSB, 0))}`, border: [0, 0, 0, 0], fontSize: 8, alignment: "right" },
            { text: "", border: [0, 0, 0, 0] },
            { text: `${formatNumber(loans.reduce((acc, obj) => acc + obj.totalDeductions, 0))}`, border: [0, 0, 0, 0], fontSize: 8, alignment: "right" },
            { text: `${formatNumber(loans.reduce((acc, obj) => acc + obj.netLoan, 0))}`, border: [0, 0, 0, 0], fontSize: 8, alignment: "right" },
            { text: "", border: [0, 0, 0, 0] },
            { text: "", border: [0, 0, 0, 0] },
          ],
          Array.from({ length: 18 }).fill({ text: "", border: [0, 0, 0, 0], margin: [0, 3, 0, 3] }),
          ...accountEntries.map((entry, i) => [
            { text: `${loans.length + (i + 1)}`, fontSize: 8, margin: [0, 5, 0, 0], alignment: "center" },
            { text: "", fontSize: 8, margin: [0, 5, 0, 0], alignment: "center" },
            { text: `${entry.code} - ${entry.description}`, fontSize: 8, margin: [0, 0, 0, 0] },
            { text: "", fontSize: 8, margin: [0, 5, 0, 0], alignment: "center" },
            { text: `${formatNumber(entry.debit)}`, fontSize: 8, margin: [0, 0, 0, 0], alignment: "right" },
            { text: `${formatNumber(entry.credit)}`, fontSize: 8, margin: [0, 0, 0, 0], alignment: "right" },
            {},
            {},
            {},
            {},
            {},
            {},
            {},
            {},
            {},
            {},
            {},
            {},
          ]),
          [
            { text: "", border: [0, 0, 0, 0] },
            { text: "", border: [0, 0, 0, 0] },
            { text: "", border: [0, 0, 0, 0] },
            { text: "", border: [0, 0, 0, 0] },
            { text: `Total:  ${formatNumber(totalDebit)}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], alignment: "right", border: [0, 0, 0, 0] },
            { text: `${formatNumber(totalCredit)}`, fontSize: 8, bold: true, margin: [0, 0, 0, 0], alignment: "right", border: [0, 0, 0, 0] },
            { text: "", border: [0, 0, 0, 0] },
            { text: "", border: [0, 0, 0, 0] },
            { text: "", border: [0, 0, 0, 0] },
            { text: "", border: [0, 0, 0, 0] },
            { text: "", border: [0, 0, 0, 0] },
            { text: "", border: [0, 0, 0, 0] },
            { text: "", border: [0, 0, 0, 0] },
            { text: "", border: [0, 0, 0, 0] },
            { text: "", border: [0, 0, 0, 0] },
            { text: "", border: [0, 0, 0, 0] },
            { text: "", border: [0, 0, 0, 0] },
            { text: "", border: [0, 0, 0, 0] },
          ],
        ],
      },
    },
    {
      margin: [9, 10, 5, 0],
      table: {
        widths: ["*", "*", "*", "*"],
        body: [
          [
            { text: "PREPARED BY:", fontSize: 8, bold: true, alignment: "center" },
            { text: "CHECKED BY:", fontSize: 8, bold: true, alignment: "center" },
            { text: "NOTED/APPROVED BY:", fontSize: 8, bold: true, alignment: "center" },
            { text: "RECEIVED BY/DATE:", fontSize: 8, bold: true, alignment: "center" },
          ],
          [
            { text: "EVD", margin: [0, 3, 0, 3], fontSize: 8, bold: true, alignment: "center" },
            { text: "", margin: [0, 3, 0, 3] },
            { text: "", margin: [0, 3, 0, 3] },
            { text: "", margin: [0, 3, 0, 3] },
          ],
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
    pageSize: "LEGAL",
    pageOrientation: "landscape",
    footer: footer,
    pageMargins: [15, 25, 15, 25],
    content: contents,
    styles: styles,
    defaultStyle: {
      font: "Roboto",
    },
  };
};
