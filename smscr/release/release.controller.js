const { pmFonts } = require("../../constants/fonts.js");
const { validateDateInput, completeNumberDate } = require("../../utils/date.js");
const { stringEscape } = require("../../utils/escape-string.js");
const { getToken } = require("../../utils/get-token.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const releaseService = require("./release.service.js");
const PdfPrinter = require("pdfmake");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const XLSX = require("xlsx");
const { formatNumber } = require("../../utils/number.js");
const { isValidObjectId, default: mongoose } = require("mongoose");
const CustomError = require("../../utils/custom-error.js");
const { releaseSummaryPrintAll } = require("./prints/print_all_summary.js");
const { releaseDetailedPrintAll } = require("./prints/print_all_detailed.js");
const { acknowledgementReceiptPrintFile } = require("./prints/print_file.js");
const { acknowledgementReceiptExportFile } = require("./prints/export_file.js");
const { categories } = require("../../constants/aror-load-entry.js");
const { relPrintByDateSummarized } = require("./prints/by-date-summarized-print.js");
const { relExportByDateSummarized } = require("./prints/by-date-summarized-export.js");
const { relPrintByDateByAccountOfficer } = require("./prints/by-date-account-officer-print.js");
const { relExportByDateByAccountOfficer } = require("./prints/by-date-account-officer-export.js");
const { relExportByAccountsSummarized } = require("./prints/by-accounts-summarized-export.js");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema.js");
const { relPrintByAccountsSummarized } = require("./prints/by-accounts-summarized-print.js");
const { relPrintByAccountsDetailed } = require("./prints/by-accounts-detailed-print.js");
const { relExportByAccountsDetailed } = require("./prints/by-accounts-detailed-export.js");
const Bank = require("../banks/bank.schema.js");
const { relPrintByBank } = require("./prints/by-bank-print.js");
const { relExportByBanks } = require("./prints/by-bank-export.js");
const { loanTypes, loanTypeValues } = require("../../constants/loan-types.js");

exports.loadEntries = async (req, res, next) => {
  try {
    const { dueDateId, type, category } = req.query;
    if (!dueDateId) throw new CustomError("Due date id is required", 400);
    if (!type) throw new CustomError("Type is required", 400);
    if (!category) throw new CustomError("Category is required", 400);

    if (!isValidObjectId(dueDateId)) throw new CustomError("Invalid due date id", 400);
    if (!loanTypes.includes(type)) throw new CustomError("Invalid type", 400);
    if (!categories.includes(category)) throw new CustomError("Invalid category", 400);

    const result = await releaseService.load_entries(dueDateId, type, category);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getSelections = async (req, res, next) => {
  try {
    const { page, limit, keyword: search } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await releaseService.get_selections(stringEscape(search), validatedLimit, validatedPage, validatedOffset);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getReleases = async (req, res, next) => {
  try {
    const { page, limit, search, sort, to, from } = req.query;
    const validatedSort = ["code-asc", "code-desc"].includes(sort) ? sort : "";
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const validatedFrom = validateDateInput(from);
    const validatedTo = validateDateInput(to);

    const result = await releaseService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search), validatedSort, validatedTo, validatedFrom);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createRelease = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await releaseService.create(req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateRelease = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id } = req.params;
    const result = await releaseService.update(id, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteRelease = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id } = req.params;
    const filter = { deletedAt: null, _id: id };
    const result = await releaseService.delete(filter, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.printAllSummary = async (req, res, next) => {
  try {
    const { docNoFrom, docNoTo } = req.query;
    const releases = await releaseService.print_all_summary(docNoFrom, docNoTo);
    const printer = new PdfPrinter(pmFonts);

    const docDefinition = releaseSummaryPrintAll(releases, docNoFrom, docNoTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed release ( Summarized )`,
      resource: `release`,
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
    if (!isValidObjectId(id)) throw new CustomError("Invalid release id", 400);

    const releases = await releaseService.print_summary_by_id(id);
    const printer = new PdfPrinter(pmFonts);

    const docDefinition = releaseSummaryPrintAll(releases);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed all release ( Summarized )`,
      resource: `release`,
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

    const releases = await releaseService.print_all_detailed(docNoFrom, docNoTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = releaseDetailedPrintAll(releases, docNoFrom, docNoTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed all release ( Detailed )`,
      resource: `release`,
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
    if (!isValidObjectId(id)) throw new CustomError("Invalid release id", 400);
    const releases = await releaseService.print_detailed_by_id(id);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = releaseDetailedPrintAll(releases);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed release ( Detailed )`,
      resource: `release`,
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
    const releases = await releaseService.print_all_detailed(docNoFrom, docNoTo);
    const data = [["Doc No", "Date", "Particular", "Bank", "Check No", "Check Date", "Amount"]];

    releases.map(transaction => {
      data.push(
        [
          `${transaction.code}`,
          completeNumberDate(transaction.date),
          transaction.remarks,
          transaction.bankCode.description,
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

    export_excel_detailed(data, res, docNoFrom, docNoTo);
  } catch (error) {
    next(error);
  }
};

exports.exportDetailedById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const releases = await releaseService.print_detailed_by_id(id);
    const data = [["Doc No", "Date", "Particular", "Bank", "Check No", "Check Date", "Amount"]];

    releases.map(transaction => {
      data.push(
        [
          `${transaction.code}`,
          completeNumberDate(transaction.date),
          transaction.remarks,
          transaction.bankCode.description,
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
  const releases = await releaseService.print_all_summary(docNoFrom, docNoTo);

  const formattedLoanReleases = releases.map(transaction => ({
    "Document Number": transaction.code,
    Date: completeNumberDate(transaction.date),
    Particulars: transaction.remarks,
    Bank: transaction.bankCode.description,
    "Check No": transaction.checkNo,
    "Check Date": completeNumberDate(transaction.checkDate),
    Amount: formatNumber(transaction.amount),
  }));

  formattedLoanReleases.push({
    "Document Number": "",
    Date: "",
    Particulars: "",
    Bank: "",
    "Check No": "",
    "Check Date": "",
    Amount: formatNumber(releases.reduce((acc, obj) => acc + (obj.amount || 0), 0)),
  });

  export_excel(formattedLoanReleases, res, docNoFrom, docNoTo);
};

exports.exportSummaryById = async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new CustomError("Invalid acknowledgement id", 400);
  const releases = await releaseService.print_summary_by_id(id);

  const formattedLoanReleases = releases.map(transaction => ({
    "Document Number": transaction.code,
    Date: completeNumberDate(transaction.date),
    Particulars: transaction.remarks,
    Bank: transaction.bankCode.description,
    "Check No": transaction.checkNo,
    "Check Date": completeNumberDate(transaction.checkDate),
    Amount: formatNumber(transaction.amount),
  }));

  formattedLoanReleases.push({
    "Document Number": "",
    Date: "",
    Particulars: "",
    Bank: "",
    "Check No": "",
    "Check Date": "",
    Amount: formatNumber(releases.reduce((acc, obj) => acc + (obj.amount || 0), 0)),
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
  const headerSubtitle = `Acknowledgement By Doc. ( Summarized )`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [title], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Acknowledgement");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  res.setHeader("Content-Disposition", 'attachment; filename="acknowledgements.xlsx"');
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
  const headerSubtitle = `Acknowledgement By Doc. ( Detailed )`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [title], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Acknowledgement");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  res.setHeader("Content-Disposition", 'attachment; filename="acknowledgements.xlsx"');
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  return res.send(excelBuffer);
};

exports.printFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await releaseService.print_file(id);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = acknowledgementReceiptPrintFile(result.payTo, result.release, result.entries);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed acknowledgement receipt ( File )`,
      resource: `acknowledgement receipt`,
      dataId: result.release._id,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.exportFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { release, payTo, entries } = await releaseService.print_file(id);

    const excelBuffer = acknowledgementReceiptExportFile(release, payTo, entries);
    res.setHeader("Content-Disposition", 'attachment; filename="acknowledgements-receipts.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported acknowledgement receipt ( File )`,
      resource: `acknowledgement receipt`,
      dataId: release._id,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------

exports.printByDateSummarized = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const acknowledgements = await releaseService.print_by_date_summarized(dateFrom, dateTo);
    const printer = new PdfPrinter(pmFonts);

    const docDefinition = relPrintByDateSummarized(acknowledgements, dateFrom, dateTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed acknowledgement receipt by date ( summarized )`,
      resource: `acknowledgement receipt`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.exportByDateSummarized = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const acknowledgements = await releaseService.print_by_date_summarized(dateFrom, dateTo);

    const excelBuffer = relExportByDateSummarized(acknowledgements, dateFrom, dateTo);

    res.setHeader("Content-Disposition", 'attachment; filename="Acknowledgement Receipt By Date ( Summarized ).xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported acknowledgement receipt by date ( summarized )`,
      resource: `acknowledgement receipt`,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

exports.printByDateAccountOfficer = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const acknowledgements = await releaseService.print_by_date_account_officer(dateFrom, dateTo);
    const printer = new PdfPrinter(pmFonts);

    const docDefinition = relPrintByDateByAccountOfficer(acknowledgements, dateFrom, dateTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed acknowledgement receipt by date ( account officer )`,
      resource: `acknowledgement receipt`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.exportByDateAccountOfficer = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const acknowledgements = await releaseService.print_by_date_account_officer(dateFrom, dateTo);

    const excelBuffer = relExportByDateByAccountOfficer(acknowledgements, dateFrom, dateTo);

    res.setHeader("Content-Disposition", 'attachment; filename="Acknowledgement Receipt By Date ( Account Officer ).xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported acknowledgement receipt by date ( account officer )`,
      resource: `acknowledgement receipt`,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
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

    const acknowledgements = await releaseService.print_by_accounts(charOfAccountObjectIds, dateFrom, dateTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = relPrintByAccountsSummarized(acknowledgements, dateFrom, dateTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed acknowledgement receipt  by accounts ( summarized )`,
      resource: `acknowledgement receipt`,
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

  const acknowledgements = await releaseService.print_by_accounts(charOfAccountObjectIds, dateFrom, dateTo);

  const excelBuffer = relExportByAccountsSummarized(acknowledgements, dateFrom, dateTo);

  res.setHeader("Content-Disposition", 'attachment; filename="Acknowledgement Receipt By Accounts ( Summarized ).xlsx"');
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  const author = getToken(req);
  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `exported acknowledgement receipt by accounts ( summarized )`,
    resource: `acknowledgement receipt`,
  });

  return res.send(excelBuffer);
};

exports.printByAccountCodeDetailed = async (req, res, next) => {
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

    const acknowledgements = await releaseService.print_by_accounts(charOfAccountObjectIds, dateFrom, dateTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = relPrintByAccountsDetailed(acknowledgements, dateFrom, dateTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed acknowledgement receipt  by accounts ( detailed )`,
      resource: `acknowledgement receipt`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.exportByAccountCodeDetailed = async (req, res, next) => {
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

    const chartOfAccounts = await releaseService.print_by_accounts(charOfAccountObjectIds, dateFrom, dateTo);

    const excelBuffer = relExportByAccountsDetailed(chartOfAccounts, dateFrom, dateTo);

    res.setHeader("Content-Disposition", 'attachment; filename="Acknowledgement Receipt By Accounts ( Detailed ).xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported acknowledgement receipt by accounts ( detailed )`,
      resource: `acknowledgement receipt`,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

exports.printByBanks = async (req, res, next) => {
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

    const banks = await releaseService.print_all_by_bank(bankObjectIds);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = relPrintByBank(banks);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed acknowledgement receipt by bank`,
      resource: `acknowledgement receipt`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.exportByBanks = async (req, res, next) => {
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

    const banks = await releaseService.print_all_by_bank(bankObjectIds);

    const excelBuffer = relExportByBanks(banks);

    res.setHeader("Content-Disposition", 'attachment; filename="Acknowledgement Receipt ( By Banks ).xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported acknowledgement receipt by bank`,
      resource: `acknowledgement receipt`,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};
