const PdfPrinter = require("pdfmake");
const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const journalVoucherService = require("./journal-voucher.service.js");
const { pmFonts } = require("../../constants/fonts.js");
const { journalVoucherSummaryPrintAll } = require("./prints/print_all_summary.js");
const { isValidObjectId, default: mongoose } = require("mongoose");
const { journalVoucherDetailedPrintAll } = require("./prints/print_all_detailed.js");
const CustomError = require("../../utils/custom-error.js");
const { getToken } = require("../../utils/get-token.js");
const { validateDateInput, completeNumberDate } = require("../../utils/date.js");
const activityLogServ = require("./../activity-logs/activity-log.service.js");
const { formatNumber } = require("../../utils/number.js");
const XLSX = require("xlsx");
const { journalVoucherPrintFile } = require("./prints/print_file.js");
const { journalVoucherExportFile } = require("./prints/export_file.js");
const signatureParamServ = require("../system-parameters/system-parameter.service.js");
const { jvPrintDetailedByDate } = require("./prints/print_detailed_by_date.js");
const { exportJVDetailedByDate } = require("./prints/export_by_date_detailed.js");
const { jvPrintSummarizedByDate } = require("./prints/print_summarized_by_date.js");
const { exportJVSummarizedByDate } = require("./prints/export_by_date_summarized.js");
const Bank = require("../banks/bank.schema.js");
const { jvPrintByBank } = require("./prints/print_all_by_bank.js");
const { jVExportByBanks } = require("./prints/export_all_by_bank.js");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema.js");
const { jvPrintDetailedByAccounts } = require("./prints/print_detailed_by_account_codes.js");
const { jvPrintSummarizedByAccounts } = require("./prints/print_summarized_by_account_codes.js");
const { jvExportByAccounts } = require("./prints/export_detailed_by_account_codes.js");
const { jvExportSummarizedByAccounts } = require("./prints/export_summarized_by_account_codes.js");

exports.getSelections = async (req, res, next) => {
  try {
    const { page, limit, keyword: search } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await journalVoucherService.get_selections(stringEscape(search), validatedLimit, validatedPage, validatedOffset);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getJournalVouchers = async (req, res, next) => {
  try {
    const { page, limit, search, sort, to, from } = req.query;
    const validatedSort = ["code-asc", "code-desc"].includes(sort) ? sort : "";
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const validatedFrom = validateDateInput(from);
    const validatedTo = validateDateInput(to);

    const result = await journalVoucherService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search), validatedSort, validatedTo, validatedFrom);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getJournalVoucher = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await journalVoucherService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createJournalVoucher = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await journalVoucherService.create(req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateJournalVoucher = async (req, res, next) => {
  try {
    const token = getToken(req);
    const filter = { _id: req.params.id };
    const result = await journalVoucherService.update(filter, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteJournalVoucher = async (req, res, next) => {
  try {
    const token = getToken(req);
    const { id } = req.params;
    const filter = { deletedAt: null, _id: id };
    const result = await journalVoucherService.delete(filter, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// PRINTING

exports.printAllSummary = async (req, res, next) => {
  try {
    const { docNoFrom, docNoTo } = req.query;
    const journalVouchers = await journalVoucherService.print_all_summary(docNoFrom, docNoTo);
    const printer = new PdfPrinter(pmFonts);

    const docDefinition = journalVoucherSummaryPrintAll(journalVouchers, docNoFrom, docNoTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed journal voucher ( Summarized )`,
      resource: `journal voucher`,
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
    if (!isValidObjectId(id)) throw new CustomError("Invalid journal voucher id", 400);

    const journalVouchers = await journalVoucherService.print_summary_by_id(id);
    const printer = new PdfPrinter(pmFonts);

    const docDefinition = journalVoucherSummaryPrintAll(journalVouchers);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed journal voucher ( Summarized )`,
      resource: `journal voucher`,
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

    const journalVouchers = await journalVoucherService.print_all_detailed(docNoFrom, docNoTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = journalVoucherDetailedPrintAll(journalVouchers, docNoFrom, docNoTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed all journal voucher ( Detailed )`,
      resource: `journal voucher`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.printAllDetailedByDate = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const journalVouchers = await journalVoucherService.print_all_detailed_by_date(dateFrom, dateTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = jvPrintDetailedByDate(journalVouchers, dateFrom, dateTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed all journal voucher ( Detailed )`,
      resource: `journal voucher`,
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

    const journalVouchers = await journalVoucherService.print_all_detailed_by_date(dateFrom, dateTo);

    const excelBuffer = exportJVDetailedByDate(journalVouchers, dateFrom, dateTo);

    res.setHeader("Content-Disposition", 'attachment; filename="Journal Vouchers ( Detailed By Date ).xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported journal voucher ( Detailed By Date )`,
      resource: `journal voucher`,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

exports.printAllSummarizedByDate = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const journalVouchers = await journalVoucherService.print_all_summarized_by_date(dateFrom, dateTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = jvPrintSummarizedByDate(journalVouchers, dateFrom, dateTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed journal voucher ( Summarized By Date )`,
      resource: `journal voucher`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.exportAllSummarizedByDate = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const journalVouchers = await journalVoucherService.print_all_summarized_by_date(dateFrom, dateTo);

    const excelBuffer = exportJVSummarizedByDate(journalVouchers, dateFrom, dateTo);

    res.setHeader("Content-Disposition", 'attachment; filename="Journal Vouchers ( Summarized By Date ).xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported journal voucher ( Detailed By Date )`,
      resource: `journal voucher`,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

exports.printDetailedById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) throw new CustomError("Invalid journal voucher id", 400);
    const journalVouchers = await journalVoucherService.print_detailed_by_id(id);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = journalVoucherDetailedPrintAll(journalVouchers);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed journal voucher ( Detailed )`,
      resource: `journal voucher`,
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
    const journalVouchers = await journalVoucherService.print_all_detailed(docNoFrom, docNoTo);
    const data = [["Doc No", "Date", "Nature", "Particular", "Bank", "Check No", "Check Date", "Amount"]];

    journalVouchers.map(transaction => {
      data.push(
        [
          `${transaction.code}`,
          completeNumberDate(transaction.date),
          transaction.nature,
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
    const journalVouchers = await journalVoucherService.print_detailed_by_id(id);
    const data = [["Doc No", "Date", "Nature", "Particular", "Bank", "Check No", "Check Date", "Amount"]];

    journalVouchers.map(transaction => {
      data.push(
        [
          `${transaction.code}`,
          completeNumberDate(transaction.date),
          transaction.nature,
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
  const journalVouchers = await journalVoucherService.print_all_summary(docNoFrom, docNoTo);

  const formattedLoanReleases = journalVouchers.map(transaction => ({
    "Document Number": transaction.code,
    Date: completeNumberDate(transaction.date),
    Nature: transaction.nature,
    Particulars: transaction.remarks,
    Bank: transaction.bankCode.description,
    "Check No": transaction.checkNo,
    "Check Date": completeNumberDate(transaction.checkDate),
    Amount: formatNumber(transaction.amount),
  }));

  formattedLoanReleases.push({
    "Document Number": "",
    Date: "",
    Nature: "",
    Particulars: "",
    Bank: "",
    "Check No": "",
    "Check Date": "",
    Amount: formatNumber(journalVouchers.reduce((acc, obj) => acc + (obj.amount || 0), 0)),
  });

  export_excel(formattedLoanReleases, res, docNoFrom, docNoTo);
};

exports.exportSummaryById = async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new CustomError("Invalid journal voucher id", 400);
  const journalVouchers = await journalVoucherService.print_summary_by_id(id);

  const formattedLoanReleases = journalVouchers.map(transaction => ({
    "Document Number": transaction.code,
    Date: completeNumberDate(transaction.date),
    Nature: transaction.nature,
    Particulars: transaction.remarks,
    Bank: transaction.bankCode.description,
    "Check No": transaction.checkNo,
    "Check Date": completeNumberDate(transaction.checkDate),
    Amount: formatNumber(transaction.amount),
  }));

  formattedLoanReleases.push({
    "Document Number": "",
    Date: "",
    Nature: "",
    Particulars: "",
    Bank: "",
    "Check No": "",
    "Check Date": "",
    Amount: formatNumber(journalVouchers.reduce((acc, obj) => acc + (obj.amount || 0), 0)),
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
  const headerSubtitle = `Journal Voucher By Doc. ( Summarized )`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [title], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Journal Voucher");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  res.setHeader("Content-Disposition", 'attachment; filename="journal-vouchers.xlsx"');
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
  const headerSubtitle = `Journal Voucher By Doc. ( Detailed )`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [title], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Journal Voucher");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  res.setHeader("Content-Disposition", 'attachment; filename="journal-vouchers.xlsx"');
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  return res.send(excelBuffer);
};

exports.printFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await journalVoucherService.print_file(id);
    const printer = new PdfPrinter(pmFonts);

    const docDefinition = journalVoucherPrintFile(result.payTo, result.journal, result.entries);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed journal voucher ( File )`,
      resource: `journal voucher`,
      dataId: result.journal._id,
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
    const { journal, payTo, entries } = await journalVoucherService.print_file(id);

    const excelBuffer = journalVoucherExportFile(journal, payTo, entries);
    res.setHeader("Content-Disposition", 'attachment; filename="journal-vouchers.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported journal voucher ( File )`,
      resource: `journal voucher`,
      dataId: journal._id,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

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

    const banks = await journalVoucherService.print_all_by_bank(bankObjectIds);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = jvPrintByBank(banks);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed journal voucher by bank`,
      resource: `journal voucher`,
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

    const banks = await journalVoucherService.print_all_by_bank(bankObjectIds);

    const excelBuffer = jVExportByBanks(banks);

    res.setHeader("Content-Disposition", 'attachment; filename="Journal Voucher ( By Banks ).xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported journal voucher by bank`,
      resource: `journal voucher`,
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

    const chartOfAccounts = await journalVoucherService.print_by_accounts(charOfAccountObjectIds, dateFrom, dateTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = jvPrintDetailedByAccounts(chartOfAccounts, dateFrom, dateTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed journal voucher by accounts ( sort by supplier )`,
      resource: `journal voucher`,
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

    const chartOfAccounts = await journalVoucherService.print_by_accounts(charOfAccountObjectIds, dateFrom, dateTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = jvPrintSummarizedByAccounts(chartOfAccounts, dateFrom, dateTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed journal voucher by accounts ( sort by client )`,
      resource: `journal voucher`,
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

  const chartOfAccounts = await journalVoucherService.print_by_accounts(charOfAccountObjectIds, dateFrom, dateTo);

  const excelBuffer = jvExportByAccounts(chartOfAccounts, dateFrom, dateTo);

  res.setHeader("Content-Disposition", 'attachment; filename="Journal Voucher By Accounts (Sort By Supplier).xlsx"');
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  const author = getToken(req);
  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `exported journal voucher by accounts ( by supplier )`,
    resource: `journal voucher`,
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

  const chartOfAccounts = await journalVoucherService.print_by_accounts(charOfAccountObjectIds, dateFrom, dateTo);

  const excelBuffer = jvExportSummarizedByAccounts(chartOfAccounts, dateFrom, dateTo);

  res.setHeader("Content-Disposition", 'attachment; filename="Journal Voucher By Accounts (Sort By Client).xlsx"');
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  const author = getToken(req);
  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `exported journal voucher by accounts ( by client )`,
    resource: `journal voucher`,
  });

  return res.send(excelBuffer);
};
