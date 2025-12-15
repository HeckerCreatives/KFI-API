const beginningBalanceService = require("./beginning-balance.service.js");
const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const { getToken } = require("../../utils/get-token.js");
const PdfPrinter = require("pdfmake");
const { pmFonts } = require("../../constants/fonts.js");
const XLSX = require("xlsx");
const { printBeginningBalanceByYearPDF } = require("./print/print-beginning-balance-by-year.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const { exportBeginningBalanceByYearExcel } = require("./print/export-beginning-balance-by-year.js");

exports.getBeginningBalances = async (req, res, next) => {
  try {
    const { page, limit, keyword } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await beginningBalanceService.get_all_paginated(stringEscape(keyword), validatedLimit, validatedPage, validatedOffset);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getBeginningBalanceEntries = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { id } = req.params;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await beginningBalanceService.get_all_entries_paginated(id, validatedLimit, validatedPage, validatedOffset);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getEntriesByAccountCode = async (req, res, next) => {
  try {
    const { year, page, limit, keyword, withAmount } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await beginningBalanceService.get_entries_by_account_code(
      parseInt(year),
      stringEscape(keyword),
      validatedLimit,
      validatedPage,
      validatedOffset,
      withAmount === "true"
    );
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.generateEntriesFromOtherYear = async (req, res, next) => {
  try {
    const year = req.params.year;
    const withAmount = req.query.withAmount;
    const result = await beginningBalanceService.get_entries_by_year(parseInt(year), withAmount === "true");
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createBeginningBalance = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await beginningBalanceService.create(req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateBeginningBalance = async (req, res, next) => {
  try {
    const id = req.params.id;
    const token = getToken(req);
    const result = await beginningBalanceService.update(id, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteBeginningBalance = async (req, res, next) => {
  try {
    const id = req.params.id;
    const token = getToken(req);
    const result = await beginningBalanceService.delete(id, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.printBeginningBalanceByYear = async (req, res, next) => {
  try {
    const year = req.params.year;
    const data = await beginningBalanceService.print_by_year(year);

    const printer = new PdfPrinter(pmFonts);

    const docDefinition = printBeginningBalanceByYearPDF(data.beginningBalance, data.entries);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed beginning balance`,
      resource: `beginning balance`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.exportBeginningBalanceByYear = async (req, res, next) => {
  try {
    const year = req.params.year;
    const data = await beginningBalanceService.print_by_year(year);

    const excelBuffer = exportBeginningBalanceByYearExcel(data.beginningBalance, data.entries);
    res.setHeader("Content-Disposition", 'attachment; filename="beginning-balance.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported beginning balance`,
      resource: `beginning balance`,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};
