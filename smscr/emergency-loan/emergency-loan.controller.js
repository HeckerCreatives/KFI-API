const { validateDateInput, completeNumberDate } = require("../../utils/date.js");
const { stringEscape } = require("../../utils/escape-string.js");
const { getToken } = require("../../utils/get-token.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const emergencyLoanService = require("./emergency-loan.service.js");
const { emergencyLoanSummaryPrintAll } = require("./prints/print_all_summary.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const { emergencyLoanDetailedPrintAll } = require("./prints/print_all_detailed.js");
const { formatNumber } = require("../../utils/number.js");
const { isValidObjectId, default: mongoose } = require("mongoose");
const signatureParamServ = require("../system-parameters/system-parameter.service.js");

const PdfPrinter = require("pdfmake");
const XLSX = require("xlsx");
const { pmFonts } = require("../../constants/fonts.js");
const { emergencyLoanPrintFile } = require("./prints/print_file.js");
const { emergencyLoanExportFile } = require("./prints/export_file.js");
const { elPrintDetailedByDate } = require("./prints/print_detailed_by_date.js");
const { elPrintSummarizedByDate } = require("./prints/print_summarized_by_date.js");
const { exportELDetailedByDate } = require("./prints/export_by_date_detailed.js");
const { exportELSummarizedByDate } = require("./prints/export_by_date_summarized.js");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema.js");
const { elPrintDetailedByAccounts } = require("./prints/print_detailed_by_account_codes.js");
const { elPrintSummarizedByAccounts } = require("./prints/print_summarized_by_account_codes.js");
const { elExportByAccounts } = require("./prints/export_detailed_by_account_codes.js");
const { elExportSummarizedByAccounts } = require("./prints/export_summarized_by_account_codes.js");

exports.getSelections = async (req, res, next) => {
  try {
    const { page, limit, keyword: search } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await emergencyLoanService.get_selections(stringEscape(search), validatedLimit, validatedPage, validatedOffset);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getEmergencyLoans = async (req, res, next) => {
  try {
    const { page, limit, search, sort, to, from } = req.query;
    const validatedSort = ["code-asc", "code-desc"].includes(sort) ? sort : "";
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const validatedFrom = validateDateInput(from);
    const validatedTo = validateDateInput(to);

    const result = await emergencyLoanService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search), validatedSort, validatedTo, validatedFrom);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getEmergencyLoan = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await emergencyLoanService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createEmergencyLoan = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await emergencyLoanService.create(req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateEmergencyLoan = async (req, res, next) => {
  try {
    const token = getToken(req);
    const filter = { _id: req.params.id };
    const result = await emergencyLoanService.update(filter, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteEmergencyLoan = async (req, res, next) => {
  try {
    const token = getToken(req);
    const filter = { _id: req.params.id };
    const result = await emergencyLoanService.delete(filter, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// PRINTOUTS

exports.printAllSummary = async (req, res, next) => {
  try {
    const { docNoFrom, docNoTo } = req.query;
    const emergencyLoans = await emergencyLoanService.print_all_summary(docNoFrom, docNoTo);
    const printer = new PdfPrinter(pmFonts);

    const docDefinition = emergencyLoanSummaryPrintAll(emergencyLoans, docNoFrom, docNoTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed emergency loan ( Summarized )`,
      resource: `emergency loan`,
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
    if (!isValidObjectId(id)) throw new CustomError("Invalid emergency loan id", 400);

    const emergencyLoans = await emergencyLoanService.print_summary_by_id(id);
    const printer = new PdfPrinter(pmFonts);

    const docDefinition = emergencyLoanSummaryPrintAll(emergencyLoans);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed emergency loan ( Summarized )`,
      resource: `emergency loan`,
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

    const emergencyLoans = await emergencyLoanService.print_all_detailed(docNoFrom, docNoTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = emergencyLoanDetailedPrintAll(emergencyLoans, docNoFrom, docNoTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed all emergency loan ( Detailed )`,
      resource: `emergency loan`,
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
    if (!isValidObjectId(id)) throw new CustomError("Invalid emergency loan id", 400);
    const emergencyLoans = await emergencyLoanService.print_detailed_by_id(id);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = emergencyLoanDetailedPrintAll(emergencyLoans);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed emergency loan ( Detailed )`,
      resource: `emergency loan`,
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
    const emergencyLoans = await emergencyLoanService.print_all_detailed(docNoFrom, docNoTo);
    const data = [["Doc No", "Date", "Name", "Particular", "Bank", "Check No", "Check Date", "Amount"]];

    emergencyLoans.map(transaction => {
      data.push(
        [
          `${transaction.code}`,
          completeNumberDate(transaction.date),
          transaction?.client?.name || "",
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
    const emergencyLoans = await emergencyLoanService.print_detailed_by_id(id);
    const data = [["Doc No", "Date", "Center Code", "Particular", "Bank", "Check No", "Check Date", "Amount"]];

    emergencyLoans.map(transaction => {
      data.push(
        [
          `${transaction.code}`,
          completeNumberDate(transaction.date),
          transaction?.client?.name || "",
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
  const emergencyLoans = await emergencyLoanService.print_all_summary(docNoFrom, docNoTo);

  const formattedLoanReleases = emergencyLoans.map(transaction => ({
    "Document Number": transaction.code,
    Date: completeNumberDate(transaction.date),
    Name: transaction?.client?.name || "",
    Particulars: transaction.remarks,
    Bank: transaction.bankCode.description,
    "Check No": transaction.checkNo,
    "Check Date": completeNumberDate(transaction.checkDate),
    Amount: formatNumber(transaction.amount),
  }));

  formattedLoanReleases.push({
    "Document Number": "",
    Date: "",
    Name: "",
    Particulars: "",
    Bank: "",
    "Check No": "",
    "Check Date": "",
    Amount: formatNumber(emergencyLoans.reduce((acc, obj) => acc + (obj.amount || 0), 0)),
  });

  export_excel(formattedLoanReleases, res, docNoFrom, docNoTo);
};

exports.exportSummaryById = async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new CustomError("Invalid expense voucher id", 400);
  const emergencyLoans = await emergencyLoanService.print_summary_by_id(id);

  const formattedLoanReleases = emergencyLoans.map(transaction => ({
    "Document Number": transaction.code,
    Date: completeNumberDate(transaction.date),
    Name: transaction?.client?.name || "",
    Particulars: transaction.remarks,
    Bank: transaction.bankCode.description,
    "Check No": transaction.checkNo,
    "Check Date": completeNumberDate(transaction.checkDate),
    Amount: formatNumber(transaction.amount),
  }));

  formattedLoanReleases.push({
    "Document Number": "",
    Date: "",
    Name: "",
    Particulars: "",
    Bank: "",
    "Check No": "",
    "Check Date": "",
    Amount: formatNumber(emergencyLoans.reduce((acc, obj) => acc + (obj.amount || 0), 0)),
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
  const headerSubtitle = `Emergency Loan By Doc. ( Summarized )`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [title], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Emergency Loan");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  res.setHeader("Content-Disposition", 'attachment; filename="emergency-loans.xlsx"');
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
  const headerSubtitle = `Emergency Loan By Doc. ( Detailed )`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [title], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Emergency Loan");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  res.setHeader("Content-Disposition", 'attachment; filename="emergency-loans.xlsx"');
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  return res.send(excelBuffer);
};

exports.printFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await emergencyLoanService.print_file(id);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = emergencyLoanPrintFile(result.payTo, result.emergency, result.entries);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed emergency loan ( File )`,
      resource: `emergency loan`,
      dataId: result.emergency._id,
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
    const { emergency, payTo, entries } = await emergencyLoanService.print_file(id);

    const excelBuffer = emergencyLoanExportFile(emergency, payTo, entries);
    res.setHeader("Content-Disposition", 'attachment; filename="emergency-loans.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported emergency loan ( File )`,
      resource: `emergency loan`,
      dataId: emergency._id,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

exports.printAllDetailedByDate = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const emergencyLoans = await emergencyLoanService.print_detailed_by_date(dateFrom, dateTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = elPrintDetailedByDate(emergencyLoans, dateFrom, dateTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed all emergency loan ( Detailed By Date )`,
      resource: `emergency loan`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.printAllSummarizedByDate = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const emergencyLoans = await emergencyLoanService.print_summarized_by_date(dateFrom, dateTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = elPrintSummarizedByDate(emergencyLoans, dateFrom, dateTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed all emergecy loan ( Detailed By Date )`,
      resource: `emergency loan`,
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

    const emergencyLoans = await emergencyLoanService.print_detailed_by_date(dateFrom, dateTo);

    const excelBuffer = exportELDetailedByDate(emergencyLoans, dateFrom, dateTo);

    res.setHeader("Content-Disposition", 'attachment; filename="Emergency Loan ( Detailed By Date ).xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported all emergency loan ( Detailed By Date )`,
      resource: `emergency loan`,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

exports.exportAllSummarizedByDate = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const emergencyLoans = await emergencyLoanService.print_summarized_by_date(dateFrom, dateTo);

    const excelBuffer = exportELSummarizedByDate(emergencyLoans, dateFrom, dateTo);

    res.setHeader("Content-Disposition", 'attachment; filename="Emergency Loan ( Summarized By Date ).xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported all emergency loan ( Detailed By Date )`,
      resource: `emergency loan`,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
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

    const chartOfAccounts = await emergencyLoanService.print_by_accounts(charOfAccountObjectIds, dateFrom, dateTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = elPrintDetailedByAccounts(chartOfAccounts, dateFrom, dateTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed emergency loan by accounts ( sort by supplier )`,
      resource: `emergency loan`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
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

    const chartOfAccounts = await emergencyLoanService.print_by_accounts(charOfAccountObjectIds, dateFrom, dateTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = elPrintSummarizedByAccounts(chartOfAccounts, dateFrom, dateTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed emergency loan by accounts ( sort by client )`,
      resource: `emergency loan`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.exportByAccountCodeDetailed = async (req, res, next) => {
  const { chartOfAccountsIds, dateFrom, dateTo } = req.body;

  if (!chartOfAccountsIds || !Array.isArray(chartOfAccountsIds)) throw new CustomError("Account code ids must be an array", 400);
  if (!Array.isArray(chartOfAccountsIds) || chartOfAccountsIds.length === 0) throw new CustomError("Account code ids must be a non-empty array", 400);

  const uniqueChartOfAccountIds = [...new Set(chartOfAccountsIds)];

  const isAllIdValid = uniqueChartOfAccountIds.every(id => isValidObjectId(id));
  if (!isAllIdValid) throw new CustomError("All account code ids must be valid ObjectIds", 400);

  const charOfAccountObjectIds = uniqueChartOfAccountIds.map(id => new mongoose.Types.ObjectId(id));

  const doesExists = await ChartOfAccount.countDocuments({ _id: { $in: charOfAccountObjectIds }, deletedAt: null }).exec();
  if (charOfAccountObjectIds.length !== doesExists) throw new CustomError("Some chart of account not found. Please check if all the chart of account sent exists.", 400);

  const chartOfAccounts = await emergencyLoanService.print_by_accounts(charOfAccountObjectIds, dateFrom, dateTo);

  const excelBuffer = elExportByAccounts(chartOfAccounts, dateFrom, dateTo);

  res.setHeader("Content-Disposition", 'attachment; filename="Emergency Loan By Accounts (Sort By Supplier).xlsx"');
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  const author = getToken(req);
  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `exported emergency loan by accounts ( by supplier )`,
    resource: `emergency loan`,
  });

  return res.send(excelBuffer);
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

  const chartOfAccounts = await emergencyLoanService.print_by_accounts(charOfAccountObjectIds, dateFrom, dateTo);

  const excelBuffer = elExportSummarizedByAccounts(chartOfAccounts, dateFrom, dateTo);

  res.setHeader("Content-Disposition", 'attachment; filename="Emergency Loan By Accounts (Sort By Client).xlsx"');
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  const author = getToken(req);
  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `exported emergency loan by accounts ( by client )`,
    resource: `emergency loan`,
  });

  return res.send(excelBuffer);
};
