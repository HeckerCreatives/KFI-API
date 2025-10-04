const { validateDateInput, completeNumberDate } = require("../../utils/date.js");
const { stringEscape } = require("../../utils/escape-string.js");
const { getToken } = require("../../utils/get-token.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const damayanFundService = require("./damayan-fund.service.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const { formatNumber } = require("../../utils/number.js");
const { isValidObjectId, default: mongoose } = require("mongoose");

const PdfPrinter = require("pdfmake");
const XLSX = require("xlsx");
const { pmFonts } = require("../../constants/fonts.js");
const { damayanFundSummaryPrintAll } = require("./prints/print_all_summary.js");
const { damayanFundDetailedPrintAll } = require("./prints/print_all_detailed.js");
const CustomError = require("../../utils/custom-error.js");
const { damayanFundPrintFile } = require("./prints/print_file.js");
const { damayanFundExportFile } = require("./prints/export_file.js");
const { dfPrintDetailedByDate } = require("./prints/print_detailed_by_date.js");
const { dfPrintSummarizedByDate } = require("./prints/print_summarized_by_date.js");
const { exportDFDetailedByDate } = require("./prints/export_by_date_detailed.js");
const { exportDFSummarizedByDate } = require("./prints/export_by_date_summarized.js");
const Bank = require("../banks/bank.schema.js");
const { dfPrintByBank } = require("./prints/print_all_by_bank.js");
const { dfExportByBanks } = require("./prints/export_all_by_bank.js");
const ChartOfAccount = require("../chart-of-account/chart-of-account.schema.js");
const { dfPrintDetailedByAccounts } = require("./prints/print_detailed_by_account_codes.js");
const { dfPrintSummarizedByAccounts } = require("./prints/print_summarized_by_account_codes.js");
const { dfExportByAccounts } = require("./prints/export_detailed_by_account_codes.js");
const { dfExportSummarizedByAccounts } = require("./prints/export_summarized_by_account_codes.js");

exports.getSelections = async (req, res, next) => {
  try {
    const { page, limit, keyword: search } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await damayanFundService.get_selections(stringEscape(search), validatedLimit, validatedPage, validatedOffset);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getDamayanFunds = async (req, res, next) => {
  try {
    const { page, limit, search, sort, to, from } = req.query;
    const validatedSort = ["code-asc", "code-desc"].includes(sort) ? sort : "";
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const validatedFrom = validateDateInput(from);
    const validatedTo = validateDateInput(to);

    const result = await damayanFundService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search), validatedSort, validatedTo, validatedFrom);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getDamayanFund = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await damayanFundService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createDamayanFund = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await damayanFundService.create(req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateDamayanFund = async (req, res, next) => {
  try {
    const token = getToken(req);
    const filter = { _id: req.params.id };
    const result = await damayanFundService.update(filter, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteDamayanFund = async (req, res, next) => {
  try {
    const token = getToken(req);
    const filter = { _id: req.params.id };
    const result = await damayanFundService.delete(filter, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// PRINTOUTS

exports.printAllSummary = async (req, res, next) => {
  try {
    const { docNoFrom, docNoTo } = req.query;
    const damayanFunds = await damayanFundService.print_all_summary(docNoFrom, docNoTo);
    const printer = new PdfPrinter(pmFonts);

    const docDefinition = damayanFundSummaryPrintAll(damayanFunds, docNoFrom, docNoTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed damayan fund ( Summarized )`,
      resource: `damayan fund`,
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
    if (!isValidObjectId(id)) throw new CustomError("Invalid damayan fund id", 400);

    const damayanFunds = await damayanFundService.print_summary_by_id(id);
    const printer = new PdfPrinter(pmFonts);

    const docDefinition = damayanFundSummaryPrintAll(damayanFunds);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed damayan fund ( Summarized )`,
      resource: `damayan fund`,
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

    const damayanFunds = await damayanFundService.print_all_detailed(docNoFrom, docNoTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = damayanFundDetailedPrintAll(damayanFunds, docNoFrom, docNoTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed all damayan fund ( Detailed )`,
      resource: `damayan fund`,
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
    if (!isValidObjectId(id)) throw new CustomError("Invalid damayan fund id", 400);
    const damayanFunds = await damayanFundService.print_detailed_by_id(id);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = damayanFundDetailedPrintAll(damayanFunds);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed damayan fund ( Detailed )`,
      resource: `damayan fund`,
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
    const damayanFunds = await damayanFundService.print_all_detailed(docNoFrom, docNoTo);
    const data = [["Doc No", "Date", "Name", "Particular", "Bank", "Check No", "Check Date", "Amount"]];

    damayanFunds.map(transaction => {
      data.push(
        [
          `${transaction.code}`,
          completeNumberDate(transaction.date),
          transaction.name,
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
    const damayanFunds = await damayanFundService.print_detailed_by_id(id);
    const data = [["Doc No", "Date", "Name", "Particular", "Bank", "Check No", "Check Date", "Amount"]];

    damayanFunds.map(transaction => {
      data.push(
        [
          `${transaction.code}`,
          completeNumberDate(transaction.date),
          transaction.name,
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
  const damayanFunds = await damayanFundService.print_all_summary(docNoFrom, docNoTo);

  const formattedLoanReleases = damayanFunds.map(transaction => ({
    "Document Number": transaction.code,
    Date: completeNumberDate(transaction.date),
    Name: transaction.name,
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
    Amount: formatNumber(damayanFunds.reduce((acc, obj) => acc + (obj.amount || 0), 0)),
  });

  export_excel(formattedLoanReleases, res, docNoFrom, docNoTo);
};

exports.exportSummaryById = async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new CustomError("Invalid expense voucher id", 400);
  const damayanFunds = await damayanFundService.print_summary_by_id(id);

  const formattedLoanReleases = damayanFunds.map(transaction => ({
    "Document Number": transaction.code,
    Date: completeNumberDate(transaction.date),
    Name: transaction.name,
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
    Amount: formatNumber(damayanFunds.reduce((acc, obj) => acc + (obj.amount || 0), 0)),
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
  const headerSubtitle = `Damayan Fund By Doc. ( Summarized )`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [title], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Damayan Fund");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  res.setHeader("Content-Disposition", 'attachment; filename="damayan-funds.xlsx"');
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
  const headerSubtitle = `Damayan Fund By Doc. ( Detailed )`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [title], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Damayan Fund");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  res.setHeader("Content-Disposition", 'attachment; filename="damayan-funds.xlsx"');
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  return res.send(excelBuffer);
};

exports.loadEntries = async (req, res, next) => {
  try {
    const { center, amount, includeAllCentersActiveMembers, resignedIncluded } = req.body;
    const result = await damayanFundService.load_entries(center, amount, includeAllCentersActiveMembers, resignedIncluded);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.printFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await damayanFundService.print_file(id);

    const printer = new PdfPrinter(pmFonts);
    const payTo = result?.damayan?.name || "";

    const docDefinition = damayanFundPrintFile(payTo, result.damayan, result.entries);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed damayan fund ( File )`,
      resource: `damayan fund`,
      dataId: result.damayan._id,
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
    const { damayan, entries } = await damayanFundService.print_file(id);
    const payTo = damayan?.name || "";

    const excelBuffer = damayanFundExportFile(damayan, payTo, entries);
    res.setHeader("Content-Disposition", 'attachment; filename="damayan-funds.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported damayan fund ( File )`,
      resource: `damayan fund`,
      dataId: damayan._id,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

exports.printAllDetailedByDate = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const damayanFunds = await damayanFundService.print_detailed_by_date(dateFrom, dateTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = dfPrintDetailedByDate(damayanFunds, dateFrom, dateTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed all damayan fund ( Detailed By Date )`,
      resource: `damayan fund`,
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

    const damayanFunds = await damayanFundService.print_summarized_by_date(dateFrom, dateTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = dfPrintSummarizedByDate(damayanFunds, dateFrom, dateTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed all damayan fund ( Detailed By Date )`,
      resource: `damayan fund`,
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

    const damayanFunds = await damayanFundService.print_detailed_by_date(dateFrom, dateTo);

    const excelBuffer = exportDFDetailedByDate(damayanFunds, dateFrom, dateTo);

    res.setHeader("Content-Disposition", 'attachment; filename="Damayan Fund ( Detailed By Date ).xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported all damayan fund ( Detailed By Date )`,
      resource: `damayan fund`,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

exports.exportAllSummarizedByDate = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const damayanFunds = await damayanFundService.print_summarized_by_date(dateFrom, dateTo);

    const excelBuffer = exportDFSummarizedByDate(damayanFunds, dateFrom, dateTo);

    res.setHeader("Content-Disposition", 'attachment; filename="Damayan Fund ( Summarized By Date ).xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported all damayan fund ( Detailed By Date )`,
      resource: `damayan fund`,
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

    const banks = await damayanFundService.print_all_by_bank(bankObjectIds);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = dfPrintByBank(banks);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed damayan fund by bank`,
      resource: `damayan fund`,
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

    const banks = await damayanFundService.print_all_by_bank(bankObjectIds);

    const excelBuffer = dfExportByBanks(banks);

    res.setHeader("Content-Disposition", 'attachment; filename="Damayan Fund ( By Banks ).xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported damayan fund by bank`,
      resource: `damayan fund`,
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

    const chartOfAccounts = await damayanFundService.print_by_accounts(charOfAccountObjectIds, dateFrom, dateTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = dfPrintDetailedByAccounts(chartOfAccounts, dateFrom, dateTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed damayan fund by accounts ( sort by supplier )`,
      resource: `damayan fund`,
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

    const chartOfAccounts = await damayanFundService.print_by_accounts(charOfAccountObjectIds, dateFrom, dateTo);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = dfPrintSummarizedByAccounts(chartOfAccounts, dateFrom, dateTo);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed damayan fund by accounts ( sort by client )`,
      resource: `damayan fund`,
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

  const chartOfAccounts = await damayanFundService.print_by_accounts(charOfAccountObjectIds, dateFrom, dateTo);

  const excelBuffer = dfExportByAccounts(chartOfAccounts, dateFrom, dateTo);

  res.setHeader("Content-Disposition", 'attachment; filename="Damayan Fund By Accounts (Sort By Supplier).xlsx"');
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  const author = getToken(req);
  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `exported damayan fund by accounts ( by supplier )`,
    resource: `damayan fund`,
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

  const chartOfAccounts = await damayanFundService.print_by_accounts(charOfAccountObjectIds, dateFrom, dateTo);

  const excelBuffer = dfExportSummarizedByAccounts(chartOfAccounts, dateFrom, dateTo);

  res.setHeader("Content-Disposition", 'attachment; filename="Damayan Fund By Accounts (Sort By Client).xlsx"');
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  const author = getToken(req);
  await activityLogServ.create({
    author: author._id,
    username: author.username,
    activity: `exported damayan fund by accounts ( by client )`,
    resource: `damayan fund`,
  });

  return res.send(excelBuffer);
};
