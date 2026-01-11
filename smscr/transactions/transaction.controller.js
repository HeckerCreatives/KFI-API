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
const { formatNumber } = require("../../utils/number.js");
const { isValidObjectId, default: mongoose } = require("mongoose");
const CustomError = require("../../utils/custom-error.js");
const { loanReleasePrintFile } = require("./print/print_file.js");
const { loanReleaseExportFile } = require("./print/export_file.js");
const { loanReleasePrintFormat2File } = require("./print/print_file_format_2.js");
const { loanReleaseExportFormat2File } = require("./print/export_file_format.js");
const { loanReleaseDetailedByDate } = require("./print/print_all_detailed_by_date.js");
const { loanReleaseSummarizedByDate } = require("./print/print_all_summary_by_date.js");
const Bank = require("../banks/bank.schema.js");
const { loanReleasePrintByBank } = require("./print/print_all_by_bank.js");
const { exportDetailedByDate } = require("./print/export_all_detailed_by_date.js");
const { exportSummarizedByDate } = require("./print/export_all_summarized_by_date.js");
const { exportAllByBanks } = require("./print/export_all_by_banks.js");
const { lrPrintByAccounts } = require("./print/print_by_account_codes.js");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema.js");
const { lrExportByAccounts } = require("./print/export_by_account_codes.js");
const { lrPrintSummarizedByAccounts } = require("./print/print_summarized_by_account_codes.js");
const { lrExportSummarizedByAccounts } = require("./print/export_summarized_by_account_codes.js");
const { printPastDuesPDF } = require("./print/past-dues-print.js");
const { pringAgingOfLoansPDF } = require("./print/aging-of-loans-print.js");
const { exportPastDuesExcel } = require("./print/part-dues-export.js");
const { exportAgingOfLoansExcel } = require("./print/aging-of-loans-export.js");

exports.getByCenter = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) throw new CustomError("Center id is required");
    if (!isValidObjectId(id)) throw new CustomError("Must be a valid center id");
    const result = await transactionServ.get_by_center(id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getDueDatesById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) throw new CustomError("Loan release id is required");
    if (!isValidObjectId(id)) throw new CustomError("Must be a valid loan release id");
    const result = await transactionServ.get_due_dates_by_id(id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

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

exports.printAllSummaryByDocument = async (req, res, next) => {
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

exports.printAllDetailedByDocument = async (req, res, next) => {
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

//  PRINT AND EXPORT FORMAT 1 and 2 Starts

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
      dataId: result.loanRelease._id,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.exportFile = async (req, res, next) => {
  try {
    const { transaction } = req.params;
    const { loanRelease, payTo, entries } = await transactionServ.print_file(transaction);

    const excelBuffer = loanReleaseExportFile(loanRelease, payTo, entries);
    res.setHeader("Content-Disposition", 'attachment; filename="loan-releases.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported loan release ( File )`,
      resource: `loan release`,
      dataId: loanRelease._id,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

exports.print2ndFormatFile = async (req, res, next) => {
  try {
    const { transaction } = req.params;
    const result = await transactionServ.print_file(transaction);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = await loanReleasePrintFormat2File(result.payTo, result.loanRelease, result.entries);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed loan release ( Format 2 File )`,
      resource: `loan release`,
      dataId: result.loanRelease._id,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.export2ndFormatFile = async (req, res, next) => {
  try {
    const { transaction } = req.params;
    const { loanRelease, payTo, entries } = await transactionServ.print_file(transaction);

    const excelBuffer = await loanReleaseExportFormat2File(loanRelease, payTo, entries);
    res.setHeader("Content-Disposition", 'attachment; filename="loan-releases.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed loan release ( Format 2 File )`,
      resource: `loan release`,
      dataId: loanRelease._id,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};
//  PRINT AND EXPORT FORMAT 1 and 2 ENDS

// PRINT AND EXPORT BY DATE STARTS
exports.printAllSummaryByDate = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const transactions = await transactionServ.print_all_summary_by_date(dateFrom, dateTo);
    const printer = new PdfPrinter(pmFonts);

    const docDefinition = loanReleaseSummarizedByDate(transactions, dateFrom, dateTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed loan release ( Summarized By Date )`,
      resource: `loan release`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.exportAllSummaryByDate = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const transactions = await transactionServ.print_all_summary_by_date(dateFrom, dateTo);

    const excelBuffer = exportSummarizedByDate(transactions, dateFrom, dateTo);

    res.setHeader("Content-Disposition", 'attachment; filename="loan-releases-by-dates.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported loan release ( Summarized By Date )`,
      resource: `loan release`,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

exports.printAllDetailedByDate = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const transactions = await transactionServ.print_all_detailed_by_date(dateFrom, dateTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = loanReleaseDetailedByDate(transactions, dateFrom, dateTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed all loan release ( Detailed By Date )`,
      resource: `loan release`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.exportAllDetailedByDate = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const transactions = await transactionServ.print_all_detailed_by_date(dateFrom, dateTo);

    const excelBuffer = exportDetailedByDate(transactions, dateFrom, dateTo);

    res.setHeader("Content-Disposition", 'attachment; filename="loan-releases-by-dates.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported loan release ( Detailed By Date )`,
      resource: `loan release`,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};
// PRINT AND EXPORT BY DATE ENDS

// PRINT AND EXPORT BY BANKS START

exports.printAllByBank = async (req, res, next) => {
  try {
    const bankIds = req?.body?.bankIds;

    if (!bankIds || !Array.isArray(bankIds)) throw new CustomError("Bank ids must be an array", 400);

    if (!Array.isArray(bankIds) || bankIds.length === 0) {
      throw new CustomError("Bank ids must be a non-empty array", 400);
    }

    const uniqueBankIds = [...new Set(bankIds)];

    const isAllIdValid = uniqueBankIds.every(id => isValidObjectId(id));
    if (!isAllIdValid) {
      throw new CustomError("All bank ids must be valid ObjectIds", 400);
    }

    const bankObjectIds = uniqueBankIds.map(id => new mongoose.Types.ObjectId(id));

    const doesExists = await Bank.countDocuments({ _id: { $in: bankObjectIds } }).exec();
    if (bankObjectIds.length !== doesExists) throw new CustomError("Some banks not found. Please check if all the banks sent exists.", 400);

    const banks = await transactionServ.print_all_by_bank(bankObjectIds);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = loanReleasePrintByBank(banks);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed loan release by bank`,
      resource: `loan release`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.exportAllByBank = async (req, res, next) => {
  try {
    const bankIds = req?.body?.bankIds;

    if (!bankIds || !Array.isArray(bankIds)) throw new CustomError("Bank ids must be an array", 400);

    if (!Array.isArray(bankIds) || bankIds.length === 0) {
      throw new CustomError("Bank ids must be a non-empty array", 400);
    }

    const uniqueBankIds = [...new Set(bankIds)];

    const isAllIdValid = uniqueBankIds.every(id => isValidObjectId(id));
    if (!isAllIdValid) {
      throw new CustomError("All bank ids must be valid ObjectIds", 400);
    }

    const bankObjectIds = uniqueBankIds.map(id => new mongoose.Types.ObjectId(id));

    const doesExists = await Bank.countDocuments({ _id: { $in: bankObjectIds } }).exec();
    if (bankObjectIds.length !== doesExists) throw new CustomError("Some banks not found. Please check if all the banks sent exists.", 400);

    const banks = await transactionServ.print_all_by_bank(bankObjectIds);

    const excelBuffer = exportAllByBanks(banks);

    res.setHeader("Content-Disposition", 'attachment; filename="loan-releases-by-banks.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported loan release by bank`,
      resource: `loan release`,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

// PRINT AND EXPORT BY BANKS ENDS

// PRINT AND EXPORT BY ACCOUNT CODES STARTS

exports.printByAccountCodes = async (req, res, next) => {
  try {
    const { chartOfAccountsIds, dateFrom, dateTo } = req.body;

    if (!chartOfAccountsIds || !Array.isArray(chartOfAccountsIds)) throw new CustomError("Account code ids must be an array", 400);
    if (!Array.isArray(chartOfAccountsIds) || chartOfAccountsIds.length === 0) throw new CustomError("Account code ids must be a non-empty array", 400);

    const uniqueChartOfAccountIds = [...new Set(chartOfAccountsIds)];

    const isAllIdValid = uniqueChartOfAccountIds.every(id => isValidObjectId(id));
    if (!isAllIdValid) throw new CustomError("All account code ids must be valid ObjectIds", 400);

    const charOfAccountObjectIds = uniqueChartOfAccountIds.map(id => new mongoose.Types.ObjectId(id));

    const doesExists = await ChartOfAccount.countDocuments({ _id: { $in: charOfAccountObjectIds }, deletedAt: null }).exec();
    if (charOfAccountObjectIds.length !== doesExists) throw new CustomError("Some chart of account not found. Please check if all the chart of account sent exists.", 400);

    const chartOfAccounts = await transactionServ.print_by_accounts(charOfAccountObjectIds, dateFrom, dateTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = lrPrintByAccounts(chartOfAccounts, dateFrom, dateTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed loan release by accounts ( detailed )`,
      resource: `loan release`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.exportByAccountCodes = async (req, res, next) => {
  const { chartOfAccountsIds, dateFrom, dateTo } = req.body;

  if (!chartOfAccountsIds || !Array.isArray(chartOfAccountsIds)) throw new CustomError("Account code ids must be an array", 400);
  if (!Array.isArray(chartOfAccountsIds) || chartOfAccountsIds.length === 0) throw new CustomError("Account code ids must be a non-empty array", 400);

  const uniqueChartOfAccountIds = [...new Set(chartOfAccountsIds)];

  const isAllIdValid = uniqueChartOfAccountIds.every(id => isValidObjectId(id));
  if (!isAllIdValid) throw new CustomError("All account code ids must be valid ObjectIds", 400);

  const charOfAccountObjectIds = uniqueChartOfAccountIds.map(id => new mongoose.Types.ObjectId(id));

  const doesExists = await ChartOfAccount.countDocuments({ _id: { $in: charOfAccountObjectIds }, deletedAt: null }).exec();
  if (charOfAccountObjectIds.length !== doesExists) throw new CustomError("Some chart of account not found. Please check if all the chart of account sent exists.", 400);

  const chartOfAccounts = await transactionServ.print_by_accounts(charOfAccountObjectIds, dateFrom, dateTo);

  const excelBuffer = lrExportByAccounts(chartOfAccounts, dateFrom, dateTo);

  res.setHeader("Content-Disposition", 'attachment; filename="Loan Release By Accounts (Sort By Client).xlsx"');
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  const author = getToken(req);
  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `exported loan release by accounts ( detailed )`,
    resource: `loan release`,
  });

  return res.send(excelBuffer);
};

exports.printByAccountCodeSummarized = async (req, res, next) => {
  try {
    const { chartOfAccountsIds, dateFrom, dateTo } = req.body;

    if (!chartOfAccountsIds || !Array.isArray(chartOfAccountsIds)) throw new CustomError("Account code ids must be an array", 400);
    if (!Array.isArray(chartOfAccountsIds) || chartOfAccountsIds.length === 0) throw new CustomError("Account code ids must be a non-empty array", 400);

    const uniqueChartOfAccountIds = [...new Set(chartOfAccountsIds)];

    const isAllIdValid = uniqueChartOfAccountIds.every(id => isValidObjectId(id));
    if (!isAllIdValid) throw new CustomError("All account code ids must be valid ObjectIds", 400);

    const charOfAccountObjectIds = uniqueChartOfAccountIds.map(id => new mongoose.Types.ObjectId(id));

    const doesExists = await ChartOfAccount.countDocuments({ _id: { $in: charOfAccountObjectIds }, deletedAt: null }).exec();
    if (charOfAccountObjectIds.length !== doesExists) throw new CustomError("Some chart of account not found. Please check if all the chart of account sent exists.", 400);

    const chartOfAccounts = await transactionServ.print_by_accounts(charOfAccountObjectIds, dateFrom, dateTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = lrPrintSummarizedByAccounts(chartOfAccounts, dateFrom, dateTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed loan release by accounts ( detailed )`,
      resource: `loan release`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.exportByAccountCodeSummarized = async (req, res, next) => {
  const { chartOfAccountsIds, dateFrom, dateTo } = req.body;

  if (!chartOfAccountsIds || !Array.isArray(chartOfAccountsIds)) throw new CustomError("Account code ids must be an array", 400);
  if (!Array.isArray(chartOfAccountsIds) || chartOfAccountsIds.length === 0) throw new CustomError("Account code ids must be a non-empty array", 400);

  const uniqueChartOfAccountIds = [...new Set(chartOfAccountsIds)];

  const isAllIdValid = uniqueChartOfAccountIds.every(id => isValidObjectId(id));
  if (!isAllIdValid) throw new CustomError("All account code ids must be valid ObjectIds", 400);

  const charOfAccountObjectIds = uniqueChartOfAccountIds.map(id => new mongoose.Types.ObjectId(id));

  const doesExists = await ChartOfAccount.countDocuments({ _id: { $in: charOfAccountObjectIds }, deletedAt: null }).exec();
  if (charOfAccountObjectIds.length !== doesExists) throw new CustomError("Some chart of account not found. Please check if all the chart of account sent exists.", 400);

  const chartOfAccounts = await transactionServ.print_by_accounts(charOfAccountObjectIds, dateFrom, dateTo);

  const excelBuffer = lrExportSummarizedByAccounts(chartOfAccounts, dateFrom, dateTo);

  res.setHeader("Content-Disposition", 'attachment; filename="Loan Release By Accounts (Sort By Client).xlsx"');
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  const author = getToken(req);
  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `exported loan release by accounts ( summarized )`,
    resource: `loan release`,
  });

  return res.send(excelBuffer);
};

// PRINT AND EXPORT BY ACCOUNT CODES ENDS

exports.printPastDues = async (req, res, next) => {
  try {
    const { centers = null, clients = null, loanReleaseDateFrom = null, loanReleaseDateTo = null, paymentDateFrom = null, paymentDateTo = null } = req.body || {};

    const { pastDues, loanCodes, from, to } = await transactionServ.get_loan_release_past_dues(
      centers,
      clients,
      loanReleaseDateFrom,
      loanReleaseDateTo,
      paymentDateFrom,
      paymentDateTo
    );

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = printPastDuesPDF(pastDues, loanCodes, from, to);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed loan release past dues`,
      resource: `loan release`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.exportPastDues = async (req, res, next) => {
  try {
    const { centers = null, clients = null, loanReleaseDateFrom = null, loanReleaseDateTo = null, paymentDateFrom = null, paymentDateTo = null } = req.body || {};

    const { pastDues, loanCodes, from, to } = await transactionServ.get_loan_release_past_dues(
      centers,
      clients,
      loanReleaseDateFrom,
      loanReleaseDateTo,
      paymentDateFrom,
      paymentDateTo
    );

    const excelBuffer = exportPastDuesExcel(pastDues, loanCodes, from, to);

    res.setHeader("Content-Disposition", 'attachment; filename="Loan Release Past Dues.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported loan release past dues`,
      resource: `loan release`,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

exports.printAgingOfLoans = async (req, res, next) => {
  try {
    const { centers = null, clients = null, loanReleaseDateFrom = null, loanReleaseDateTo = null, paymentDateFrom = null, paymentDateTo = null } = req.body || {};

    const { pastDues, loanCodes, from, to } = await transactionServ.get_loan_release_aging_of_loan(
      centers,
      clients,
      loanReleaseDateFrom,
      loanReleaseDateTo,
      paymentDateFrom,
      paymentDateTo
    );

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = pringAgingOfLoansPDF(pastDues, loanCodes, from, to);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed loan release aging of loands`,
      resource: `loan release`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.exportAgingOfLoans = async (req, res, next) => {
  try {
    const { centers = null, clients = null, loanReleaseDateFrom = null, loanReleaseDateTo = null, paymentDateFrom = null, paymentDateTo = null } = req.body || {};

    const { pastDues, loanCodes, from, to } = await transactionServ.get_loan_release_aging_of_loan(
      centers,
      clients,
      loanReleaseDateFrom,
      loanReleaseDateTo,
      paymentDateFrom,
      paymentDateTo
    );

    const excelBuffer = exportAgingOfLoansExcel(pastDues, loanCodes, from, to);

    res.setHeader("Content-Disposition", 'attachment; filename="Loan Release Aging Of Loans.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported loan release aging of loands`,
      resource: `loan release`,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

exports.getLoanReleasesWithDueDates = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await transactionServ.get_loan_releases_with_due_dates(validatedLimit, validatedPage, validatedOffset);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
