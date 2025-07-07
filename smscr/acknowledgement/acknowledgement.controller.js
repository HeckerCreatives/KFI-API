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
const { isValidObjectId } = require("mongoose");
const CustomError = require("../../utils/custom-error.js");
const { acknowledgementSummaryPrintAll } = require("./prints/print_all_summary.js");
const { acknowledgementDetailedPrintAll } = require("./prints/print_all_detailed.js");

exports.getSelections = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
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
          `CV#${transaction.code}`,
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
          `CV#${transaction.code}`,
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
  if (from && !to) title = `Doc. No. From CV#${from}`;
  if (to && !from) title = `Doc. No. To CV#${to}`;
  if (to && from) title = `Doc. No. From CV#${from} To CV#${to}`;

  const headerTitle = "KAALALAY FOUNDATION, INC. (LB)";
  const headerSubtitle = `Acknowledgements By Doc. ( Summarized )`;
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
  if (docNoFrom && !docNoTo) title = `Doc. No. From CV#${docNoFrom}`;
  if (docNoTo && !docNoFrom) title = `Doc. No. To CV#${docNoTo}`;
  if (docNoTo && docNoFrom) title = `Doc. No. From CV#${docNoFrom} To CV#${docNoTo}`;

  const headerTitle = "KAALALAY FOUNDATION, INC. (LB)";
  const headerSubtitle = `Acknowledgements By Doc. ( Detailed )`;
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [title], [dateTitle], []], { origin: "A2" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Acknowledgements");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  res.setHeader("Content-Disposition", 'attachment; filename="acknowledgements.xlsx"');
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  return res.send(excelBuffer);
};
