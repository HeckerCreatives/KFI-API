const { pmFonts } = require("../../constants/fonts.js");
const { validateDateInput, completeNumberDate } = require("../../utils/date.js");
const { stringEscape } = require("../../utils/escape-string.js");
const { getToken } = require("../../utils/get-token.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const acknowledgementServ = require("./acknowledgement.service.js");
const PdfPrinter = require("pdfmake");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const XLSX = require("xlsx");
const { formatNumber } = require("../../utils/number.js");
const { isValidObjectId, default: mongoose } = require("mongoose");
const CustomError = require("../../utils/custom-error.js");
const { acknowledgementSummaryPrintAll } = require("./prints/print_all_summary.js");
const { acknowledgementDetailedPrintAll } = require("./prints/print_all_detailed.js");
const { officialReceiptPrintFile } = require("./prints/print_file.js");
const { officialReceiptExportFile } = require("./prints/export_file.js");
const { exportDetailedByDateByAccountOfficer } = require("./prints/by-date-account-officer-export.js");
const { printByDateByAccountOfficer } = require("./prints/by-date-account-officer-print.js");
const { ackPrintByDateSummarized } = require("./prints/by-date-summarized-print.js");
const { ackExportByDateSummarized } = require("./prints/by-date-summarized-export.js");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema.js");
const { ackPrintByAccountsSummarized } = require("./prints/by-accounts-summarized-print.js");
const { ackExportByAccountsSummarized } = require("./prints/by-accounts-summarized-export.js");
const { ackPrintByAccountsDetailed } = require("./prints/by-accounts-detailed-print.js");
const { ackExportByAccountsDetailed } = require("./prints/by-accounts-detailed-export.js");
const { ackPrintByBank } = require("./prints/by-bank-print.js");
const Bank = require("../banks/bank.schema.js");
const { ackExportByBanks } = require("./prints/by-bank-export.js");
const { loanTypes, loanTypeValues } = require("../../constants/loan-types.js");

exports.loadEntries = async (req, res, next) => {
  try {
    const { dueDateId, type, category } = req.query;
    if (!dueDateId) throw new CustomError("Due date id is required", 400);

    if (!isValidObjectId(dueDateId)) throw new CustomError("Invalid due date id", 400);
    if (!loanTypes.includes(type)) throw new CustomError("Invalid type", 400);

    const result = await acknowledgementServ.load_entries(dueDateId, type);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getSelections = async (req, res, next) => {
  try {
    const { page, limit, keyword: search } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await acknowledgementServ.get_selections(stringEscape(search), validatedLimit, validatedPage, validatedOffset);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getAcknowledgements = async (req, res, next) => {
  try {
    const { page, limit, search, sort, to, from } = req.query;
    const validatedSort = ["code-asc", "code-desc"].includes(sort) ? sort : "";
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const validatedFrom = validateDateInput(from);
    const validatedTo = validateDateInput(to);

    const result = await acknowledgementServ.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search), validatedSort, validatedTo, validatedFrom);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createAcknowledgement = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await acknowledgementServ.create(req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateAcknowledgement = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id } = req.params;
    const result = await acknowledgementServ.update(id, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteAcknowledgement = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id } = req.params;
    const filter = { deletedAt: null, _id: id };
    const result = await acknowledgementServ.delete(filter, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.printAllSummary = async (req, res, next) => {
  try {
    const { docNoFrom, docNoTo } = req.query;
    const acknowledgements = await acknowledgementServ.print_all_summary(docNoFrom, docNoTo);
    const printer = new PdfPrinter(pmFonts);

    const docDefinition = acknowledgementSummaryPrintAll(acknowledgements, docNoFrom, docNoTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed acknowledgement ( Summarized )`,
      resource: `acknowledgement`,
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
    if (!isValidObjectId(id)) throw new CustomError("Invalid acknowledgement id", 400);

    const acknowledgements = await acknowledgementServ.print_summary_by_id(id);
    const printer = new PdfPrinter(pmFonts);

    const docDefinition = acknowledgementSummaryPrintAll(acknowledgements);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed all acknowledgement ( Summarized )`,
      resource: `acknowledgement`,
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

    const acknowledgements = await acknowledgementServ.print_all_detailed(docNoFrom, docNoTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = acknowledgementDetailedPrintAll(acknowledgements, docNoFrom, docNoTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed all acknowledgement ( Detailed )`,
      resource: `acknowledgement`,
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
    if (!isValidObjectId(id)) throw new CustomError("Invalid acknowledgement id", 400);
    const acknowledgements = await acknowledgementServ.print_detailed_by_id(id);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = acknowledgementDetailedPrintAll(acknowledgements);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed acknowledgement ( Detailed )`,
      resource: `acknowledgement`,
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
    const acknowledgements = await acknowledgementServ.print_all_detailed(docNoFrom, docNoTo);
    const data = [["Doc No", "Date", "Particular", "Bank", "Check No", "Check Date", "Amount"]];

    acknowledgements.map(transaction => {
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
    const acknowledgements = await acknowledgementServ.print_detailed_by_id(id);
    const data = [["Doc No", "Date", "Particular", "Bank", "Check No", "Check Date", "Amount"]];

    acknowledgements.map(transaction => {
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
  const acknowledgements = await acknowledgementServ.print_all_summary(docNoFrom, docNoTo);

  const formattedLoanReleases = acknowledgements.map(transaction => ({
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
    Amount: formatNumber(acknowledgements.reduce((acc, obj) => acc + (obj.amount || 0), 0)),
  });

  export_excel(formattedLoanReleases, res, docNoFrom, docNoTo);
};

exports.exportSummaryById = async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new CustomError("Invalid acknowledgement id", 400);
  const acknowledgements = await acknowledgementServ.print_summary_by_id(id);

  const formattedLoanReleases = acknowledgements.map(transaction => ({
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
    Amount: formatNumber(acknowledgements.reduce((acc, obj) => acc + (obj.amount || 0), 0)),
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
  const headerSubtitle = `Official Receipt By Doc. ( Summarized )`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [title], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Official Receipt");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  res.setHeader("Content-Disposition", 'attachment; filename="official-receipt.xlsx"');
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
  const headerSubtitle = `Official Receipt By Doc. ( Detailed )`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [title], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Official Receipt");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  res.setHeader("Content-Disposition", 'attachment; filename="official-receipt.xlsx"');
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  return res.send(excelBuffer);
};

exports.printFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await acknowledgementServ.print_file(id);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = officialReceiptPrintFile(result.payTo, result.officialReceipt, result.entries);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed official receipt ( File )`,
      resource: `official receipt`,
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
    const { officialReceipt, payTo, entries } = await acknowledgementServ.print_file(id);

    const excelBuffer = officialReceiptExportFile(officialReceipt, payTo, entries);
    res.setHeader("Content-Disposition", 'attachment; filename="official-receipts.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported official receipt ( File )`,
      resource: `official receipt`,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

exports.printByDateSummarized = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const officialReceipts = await acknowledgementServ.print_by_date_summarized(dateFrom, dateTo);
    const printer = new PdfPrinter(pmFonts);

    const docDefinition = ackPrintByDateSummarized(officialReceipts, dateFrom, dateTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed official receipt by date ( summarized )`,
      resource: `official receipt`,
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
    const officialReceipts = await acknowledgementServ.print_by_date_summarized(dateFrom, dateTo);

    const excelBuffer = ackExportByDateSummarized(officialReceipts, dateFrom, dateTo);

    res.setHeader("Content-Disposition", 'attachment; filename="Official Receipt By Date ( Summarized ).xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported official receipt by date ( summarized )`,
      resource: `official receipt`,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

exports.printByDateAccountOfficer = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const officialReceipts = await acknowledgementServ.print_by_date_account_officer(dateFrom, dateTo);
    const printer = new PdfPrinter(pmFonts);

    const docDefinition = printByDateByAccountOfficer(officialReceipts, dateFrom, dateTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed official receipt by date ( account officer )`,
      resource: `official receipt`,
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
    const officialReceipts = await acknowledgementServ.print_by_date_account_officer(dateFrom, dateTo);

    const excelBuffer = exportDetailedByDateByAccountOfficer(officialReceipts, dateFrom, dateTo);

    res.setHeader("Content-Disposition", 'attachment; filename="Official Receipt By Date ( Account Officer ).xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported official receipt by date ( account officer )`,
      resource: `official receipt`,
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

    const officialReceipts = await acknowledgementServ.print_by_accounts(charOfAccountObjectIds, dateFrom, dateTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = ackPrintByAccountsSummarized(officialReceipts, dateFrom, dateTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed official receipt  by accounts ( summarized )`,
      resource: `official receipt`,
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

  const chartOfAccounts = await acknowledgementServ.print_by_accounts(charOfAccountObjectIds, dateFrom, dateTo);

  const excelBuffer = ackExportByAccountsSummarized(chartOfAccounts, dateFrom, dateTo);

  res.setHeader("Content-Disposition", 'attachment; filename="Official Receipt By Accounts ( Summarized ).xlsx"');
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  const author = getToken(req);
  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `exported official receipt by accounts ( summarized )`,
    resource: `official receipt`,
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

    const chartOfAccounts = await acknowledgementServ.print_by_accounts(charOfAccountObjectIds, dateFrom, dateTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = ackPrintByAccountsDetailed(chartOfAccounts, dateFrom, dateTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed official receipt  by accounts ( detailed )`,
      resource: `official receipt`,
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

    const chartOfAccounts = await acknowledgementServ.print_by_accounts(charOfAccountObjectIds, dateFrom, dateTo);

    const excelBuffer = ackExportByAccountsDetailed(chartOfAccounts, dateFrom, dateTo);

    res.setHeader("Content-Disposition", 'attachment; filename="Official Receipt By Accounts ( Detailed ).xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported official receipt by accounts ( detailed )`,
      resource: `official receipt`,
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

    const banks = await acknowledgementServ.print_all_by_bank(bankObjectIds);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = ackPrintByBank(banks);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed official receipt by bank`,
      resource: `official receipt`,
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

    const banks = await acknowledgementServ.print_all_by_bank(bankObjectIds);

    const excelBuffer = ackExportByBanks(banks);

    res.setHeader("Content-Disposition", 'attachment; filename="Official Receipt ( By Banks ).xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported official receipt by bank`,
      resource: `official receipt`,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};
