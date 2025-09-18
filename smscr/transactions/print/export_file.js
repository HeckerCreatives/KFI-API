const { completeNumberDate } = require("../../../utils/date");
const { formatNumber, numberToWordsWithDecimals } = require("../../../utils/number");
const XLSX = require("xlsx-js-style");

exports.loanReleaseExportFile = (loanRelease, payTo, entries) => {
  let particulars = [];
  let accountEntries = [];
  let totalDebit = 0;
  let totalCredit = 0;
  let totalAmount = Number(loanRelease.amount);

  if (loanRelease.remarks) particulars.push(`${loanRelease.remarks}`);
  entries.map(entry => {
    // if (entry.particular) particulars.push(`${entry.particular}`);
    if (entry.client) totalAmount -= Number(entry.credit);

    totalDebit += Number(entry.debit) || 0;
    totalCredit += Number(entry.credit) || 0;

    const isAdded = accountEntries.findIndex(e => e.code === entry.acctCode.code);

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
        merge: { cols: 5 },
      },
    ],
    [{ v: "10001 Mt. Halcon St. , Umali Subd.", t: "s", s: { alignment: { vertical: "center", horizontal: "center" } }, merge: { cols: 5 } }],
    [{ v: "Batong Malake, Los Baños, Laguna", t: "s", s: { alignment: { vertical: "center", horizontal: "center" } }, merge: { cols: 5 } }],
    [{ v: "Tel. No. (049) 536-4501", t: "s", s: { alignment: { vertical: "center", horizontal: "center" } }, merge: { cols: 5 } }],
    [{ v: "" }],
    [{ v: "CHECK VOUCHER ( LOAN RELEASE )", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } }, merge: { cols: 5 } }],
    [{ v: "" }],
    [
      { v: "PAY TO", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "left" } } },
      { v: `${payTo}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: botBorder } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "DATE", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "left" } } },
      { v: `${completeNumberDate(loanRelease.date)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: botBorder } },
    ],
    [
      { v: "AMOUNT", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "left" } } },
      {
        v: `( In Figures ) P ${formatNumber(totalAmount)}`,
        t: "s",
        s: { font: { bold: true, sz: 9 }, alignment: { vertical: "center", horizontal: "left", wrapText: true }, border: botBorder, merge: { rows: 2 } },
      },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "DOC NO", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "left" } } },
      { v: `${loanRelease.code}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: botBorder } },
    ],
    [
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "left" } } },
      {
        v: `( In Words ) ${numberToWordsWithDecimals(Number(totalAmount).toFixed(2))}`,
        t: "s",
        s: { font: { bold: true, sz: 9 }, alignment: { vertical: "center", horizontal: "left", wrapText: true }, border: botBorder },
      },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: botBorder } },
      { v: "BANK", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "left" } } },
      { v: `${loanRelease.bank.description}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: botBorder } },
    ],
    [
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "left" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "CHECK NO", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "left" } } },
      { v: `${loanRelease.checkNo}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: botBorder } },
    ],
    [{ v: "" }],
    [
      {
        v: "Particulars",
        t: "s",
        s: {
          font: { bold: true },
          alignment: { vertical: "center", horizontal: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        },
        merge: { cols: 5 },
      },
      ...Array.from({ length: 4 }, () => ({ v: "", t: "s", s: { border: fullBorder } })),
    ],
  ];

  particulars.forEach((particular, rowIndex) => {
    const row = [];

    for (let colIndex = 0; colIndex < 5; colIndex++) {
      let border = {
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      };

      if (rowIndex === particulars.length - 1) {
        border.bottom = { style: "thin", color: { rgb: "000000" } };
      }

      const cell = {
        v: colIndex === 0 ? particular : "", // Text only in first column
        t: "s",
        s: {
          border,
          alignment: {
            vertical: "center",
            horizontal: colIndex === 0 ? "start" : "center",
          },
        },
      };
      if (colIndex === 0) cell.merge = { cols: 5 };
      row.push(cell);
    }

    datas.push(row);
  });

  datas.push([
    { v: "GL Code", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
    { v: "CTR Code Client Name", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
    { v: "Account Titles", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
    { v: "Debit", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
    { v: "Credit", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
  ]);

  entries.map(entry => {
    datas.push([
      { v: `${entry.acctCode.code}`, t: "s", s: { alignment: { vertical: "center", horizontal: "center" } } },
      {
        v: entry?.client?._id ? `${entry.center.centerNo} - ${entry?.client?.name}` : "",
        t: "s",
        s: { alignment: { vertical: "center", horizontal: "center" } },
      },
      { v: `${entry.acctCode.description}`, t: "s", s: { alignment: { vertical: "center", horizontal: "center" } } },
      { v: `${formatNumber(entry.debit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${formatNumber(entry.credit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    ]);
  });

  datas.push([{ v: "" }]);

  accountEntries.map(entry => {
    datas.push([
      { v: `${entry.code}`, t: "s", s: { alignment: { vertical: "center", horizontal: "center" } } },
      { v: `${entry.description}`, t: "s", s: { alignment: { vertical: "center", horizontal: "center" } } },
      { v: "" },
      { v: `${formatNumber(entry.debit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
      { v: `${formatNumber(entry.credit)}`, t: "s", s: { alignment: { vertical: "center", horizontal: "right" } } },
    ]);
  });

  datas.push([{ v: "" }]);

  datas.push([
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
    { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
    { v: "Grand Total:", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
    { v: `${formatNumber(totalDebit)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
    { v: `${formatNumber(totalDebit)}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "right" } } },
  ]);

  datas.push([{ v: "" }]);
  datas.push([{ v: "" }]);
  datas.push([{ v: "" }]);
  datas.push([{ v: "" }]);

  datas.push(
    [
      { v: "PREPARED BY:", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
      { v: "CHECKED BY:", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
      { v: "", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: "APPROVED BY:", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
      { v: "RECEIVED BY/DATE:", t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
    ],
    [
      { v: `${loanRelease.preparedBy}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
      { v: `${loanRelease.checkedBy}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
      { v: ``, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } } },
      { v: `${loanRelease.approvedBy}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
      { v: `${loanRelease.receivedBy}`, t: "s", s: { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" }, border: fullBorder } },
    ]
  );

  const merges = [];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(datas, { origin: "A1" });

  datas.forEach((row, rowIndex) => {
    let currentCol = 0;

    row.forEach((cell, colIndex) => {
      if (cell.merge && cell.merge.cols) {
        merges.push({
          s: { r: rowIndex, c: currentCol },
          e: { r: rowIndex, c: currentCol + cell.merge.cols - 1 },
        });
        currentCol += cell.merge.cols;
      } else {
        currentCol++;
      }
    });
  });

  merges.push({ s: { r: 8, c: 1 }, e: { r: 8, c: 2 } }, { s: { r: 9, c: 1 }, e: { r: 9, c: 2 } });

  ws["!merges"] = merges;

  ws["!cols"] = Array.from(Array(5)).fill({ wch: 30 });

  XLSX.utils.book_append_sheet(wb, ws, "Loan Release");

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

  return excelBuffer;
};
