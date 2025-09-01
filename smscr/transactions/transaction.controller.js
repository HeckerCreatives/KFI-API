const { pmFonts } = require("../../constants/fonts.js");
const { validateDateInput, completeNumberDate } = require("../../utils/date.js");
const { stringEscape } = require("../../utils/escape-string.js");
const { getToken } = require("../../utils/get-token.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const { loanReleaseDetailedPrintAll } = require("./print/print_all_detailed.js");
const transactionServ = require("./transaction.service.js");
const PdfPrinter = require("pdfmake");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const XLSX = require("xlsx-js-style");
const { loanReleaseSummaryPrintAll } = require("./print/print_all_summary.js");
const { formatNumber, numberToWordsWithDecimals } = require("../../utils/number.js");
const { isValidObjectId } = require("mongoose");
const CustomError = require("../../utils/custom-error.js");
const { loanReleasePrintFile } = require("./print/print_file.js");
const { loanReleaseExportFile } = require("./print/export_file.js");

exports.getSelections = async (req, res, next) => {
  try {
    const { page, limit, keyword: search, center } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await transactionServ.get_selections(stringEscape(search), validatedLimit, validatedPage, validatedOffset);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getLoanReleases = async (req, res, next) => {
  try {
    const { page, limit, search, sort, to, from } = req.query;
    const validatedSort = ["code-asc", "code-desc"].includes(sort) ? sort : "";
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const validatedFrom = validateDateInput(from);
    const validatedTo = validateDateInput(to);

    const result = await transactionServ.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search), validatedSort, "loan release", validatedTo, validatedFrom);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.loadEntries = async (req, res, next) => {
  try {
    const result = await transactionServ.load_entries(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createLoanRelease = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await transactionServ.create_loan_release(req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateLoanRelease = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id } = req.params;
    const result = await transactionServ.update_loan_release(id, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteLoanRelease = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id } = req.params;
    const filter = { deletedAt: null, _id: id };
    const result = await transactionServ.delete_loan_release(filter, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.printFile = async (req, res, next) => {
  try {
    const { transaction } = req.params;
    const result = await transactionServ.print_file(transaction);
    const printer = new PdfPrinter(pmFonts);

    const docDefinition = loanReleasePrintFile(result.payTo, result.loanRelease, result.entries);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed loan release ( File )`,
      resource: `loan release`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.printAllSummary = async (req, res, next) => {
  try {
    const { docNoFrom, docNoTo } = req.query;
    const transactions = await transactionServ.print_all_summary(docNoFrom, docNoTo);
    const printer = new PdfPrinter(pmFonts);

    const docDefinition = loanReleaseSummaryPrintAll(transactions, docNoFrom, docNoTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed loan release ( Summarized )`,
      resource: `loan release`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.printSummaryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) throw new CustomError("Invalid loan release id", 400);

    const transactions = await transactionServ.print_summary_by_id(id);
    const printer = new PdfPrinter(pmFonts);

    const docDefinition = loanReleaseSummaryPrintAll(transactions);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed all loan release ( Summarized )`,
      resource: `loan release`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.printAllDetailed = async (req, res, next) => {
  try {
    const { docNoFrom, docNoTo } = req.query;

    const transactions = await transactionServ.print_all_detailed(docNoFrom, docNoTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = loanReleaseDetailedPrintAll(transactions, docNoFrom, docNoTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed all loan release ( Detailed )`,
      resource: `loan release`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.printDetailedById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) throw new CustomError("Invalid loan release id", 400);
    const transactions = await transactionServ.print_detailed_by_id(id);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = loanReleaseDetailedPrintAll(transactions);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed loan release ( Detailed )`,
      resource: `loan release`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.exportAllDetailed = async (req, res, next) => {
  try {
    const { docNoFrom, docNoTo } = req.query;
    const transactions = await transactionServ.print_all_detailed(docNoFrom, docNoTo);
    const data = [["Doc No", "Date", "Supplier", "Particular", "Bank", "Check No", "Check Date", "Amount"]];

    transactions.map(transaction => {
      data.push(
        [
          `${transaction.code}`,
          completeNumberDate(transaction.date),
          transaction.center.description,
          transaction.remarks,
          transaction.bank.description,
          transaction.checkNo,
          completeNumberDate(transaction.checkDate),
          formatNumber(transaction.amount),
        ],
        [],
        ["", "Account Code", "Description", "Debit", "Credit", "Particulars"],
        ...transaction.entries.map(entry => ["", entry?.acctCode?.code, entry?.acctCode?.description, formatNumber(entry.debit), formatNumber(entry.credit), entry.particular]),
        [
          "",
          "",
          "",
          formatNumber(transaction.entries.reduce((acc, obj) => acc + (obj.debit || 0), 0)),
          formatNumber(transaction.entries.reduce((acc, obj) => acc + (obj.credit || 0), 0)),
          "",
        ],
        [],
        []
      );
    });

    export_excel_detailed(data, res, docNoFrom, docNoTo);
  } catch (error) {
    next(error);
  }
};

exports.exportDetailedById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transactions = await transactionServ.print_detailed_by_id(id);
    const data = [["Doc No", "Date", "Supplier", "Particular", "Bank", "Check No", "Check Date", "Amount"]];

    transactions.map(transaction => {
      data.push(
        [
          `${transaction.code}`,
          completeNumberDate(transaction.date),
          transaction.center.description,
          transaction.remarks,
          transaction.bank.description,
          transaction.checkNo,
          completeNumberDate(transaction.checkDate),
          formatNumber(transaction.amount),
        ],
        [],
        ["", "Account Code", "Description", "Debit", "Credit", "Particulars"],
        ...transaction.entries.map(entry => ["", entry.acctCode.code, entry.acctCode.description, formatNumber(entry.debit), formatNumber(entry.credit), entry.particular]),
        [
          "",
          "",
          "",
          formatNumber(transaction.entries.reduce((acc, obj) => acc + (obj.debit || 0), 0)),
          formatNumber(transaction.entries.reduce((acc, obj) => acc + (obj.credit || 0), 0)),
          "",
        ],
        [],
        []
      );
    });

    export_excel_detailed(data, res);
  } catch (error) {
    next(error);
  }
};

exports.exportAllSummary = async (req, res, next) => {
  const { docNoFrom, docNoTo } = req.query;
  const transactions = await transactionServ.print_all_summary(docNoFrom, docNoTo);

  const formattedLoanReleases = transactions.map(transaction => ({
    "Document Number": transaction.code,
    Date: completeNumberDate(transaction.date),
    Supplier: transaction.center.description,
    Particulars: transaction.remarks,
    Bank: transaction.bank.description,
    "Check No": transaction.checkNo,
    "Check Date": completeNumberDate(transaction.checkDate),
    Amount: formatNumber(transaction.amount),
  }));

  formattedLoanReleases.push({
    "Document Number": "",
    Date: "",
    Supplier: "",
    Particulars: "",
    Bank: "",
    "Check No": "",
    "Check Date": "",
    Amount: formatNumber(transactions.reduce((acc, obj) => acc + (obj.amount || 0), 0)),
  });

  export_excel(formattedLoanReleases, res, docNoFrom, docNoTo);
};

exports.exportSummaryById = async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new CustomError("Invalid loan release id", 400);
  const transactions = await transactionServ.print_summary_by_id(id);

  const formattedLoanReleases = transactions.map(transaction => ({
    "Document Number": transaction.code,
    Date: completeNumberDate(transaction.date),
    Supplier: transaction.center.description,
    Particulars: transaction.remarks,
    Bank: transaction.bank.description,
    "Check No": transaction.checkNo,
    "Check Date": completeNumberDate(transaction.checkDate),
    Amount: formatNumber(transaction.amount),
  }));

  formattedLoanReleases.push({
    "Document Number": "",
    Date: "",
    Supplier: "",
    Particulars: "",
    Bank: "",
    "Check No": "",
    "Check Date": "",
    Amount: formatNumber(transactions.reduce((acc, obj) => acc + (obj.amount || 0), 0)),
  });

  export_excel(formattedLoanReleases, res);
};

exports.exportFile = async (req, res, next) => {
  try {
    const { transaction } = req.params;
    const { loanRelease, payTo, entries } = await transactionServ.print_file(transaction);

    const excelBuffer = loanReleaseExportFile(loanRelease, payTo, entries);
    res.setHeader("Content-Disposition", 'attachment; filename="loan-releases.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

const export_excel = (datas, res, from, to) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(datas, { origin: "A7" });

  worksheet["!cols"] = Array.from(Array(12)).fill({ wch: 20 });

  let title = "";
  if (from && !to) title = `Doc. No. From ${from}`;
  if (to && !from) title = `Doc. No. To ${to}`;
  if (to && from) title = `Doc. No. From ${from} To ${to}`;

  const headerTitle = "KAALALAY FOUNDATION, INC. (LB)";
  const headerSubtitle = `Loan Release By Doc. ( Summarized )`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [title], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Loan Release");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  res.setHeader("Content-Disposition", 'attachment; filename="loan-releases.xlsx"');
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  return res.send(excelBuffer);
};

const export_excel_detailed = (data, res, docNoFrom, docNoTo) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(data, { origin: "A7" });

  worksheet["!cols"] = Array.from(Array(12)).fill({ wch: 20 });

  let title = "";
  if (docNoFrom && !docNoTo) title = `Doc. No. From ${docNoFrom}`;
  if (docNoTo && !docNoFrom) title = `Doc. No. To ${docNoTo}`;
  if (docNoTo && docNoFrom) title = `Doc. No. From ${docNoFrom} To ${docNoTo}`;

  const headerTitle = "KAALALAY FOUNDATION, INC. (LB)";
  const headerSubtitle = `Loan Release By Doc. ( Detailed )`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [title], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Loan Release");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  res.setHeader("Content-Disposition", 'attachment; filename="loan-releases.xlsx"');
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  return res.send(excelBuffer);
};
