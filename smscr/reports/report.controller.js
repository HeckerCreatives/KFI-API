const PdfPrinter = require("pdfmake");
const reportService = require("./report.service.js");
const { pmFonts } = require("../../constants/fonts.js");
const { getToken } = require("../../utils/get-token.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const { printActivityReportPDF } = require("./prints/activity-report-print.js");
const { exportActivityReporExcel } = require("./prints/activity-report-export.js");
const { printAuditTrailReportPDF } = require("./prints/audit-trail-report-print.js");
const { exportAuditTrailReporExcel } = require("./prints/audit-trail-report-export.js");

exports.printActivityReport = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, codeFrom, codeTo, withBeginningBalance, year = null } = req.query;
    const result = await reportService.print_activity_report(dateFrom, dateTo, codeFrom, codeTo, withBeginningBalance === "true", year);
    const printer = new PdfPrinter(pmFonts);

    const docDefinition = printActivityReportPDF(result.entries, result.beginningBalance, dateFrom, dateTo);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed g/l activity report`,
      resource: `general ledger`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.exportActivityReport = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, codeFrom, codeTo, withBeginningBalance, year = null } = req.query;
    const result = await reportService.print_activity_report(dateFrom, dateTo, codeFrom, codeTo, withBeginningBalance, year);

    const excelBuffer = exportActivityReporExcel(result.entries, result.beginningBalance, dateFrom, dateTo);
    res.setHeader("Content-Disposition", 'attachment; filename="gl-activity-report.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported g/l activity report`,
      resource: `general ledger`,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

exports.printAuditTrail = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, codeFrom, codeTo, withBeginningBalance, year = null } = req.query;
    const result = await reportService.print_activity_report(dateFrom, dateTo, codeFrom, codeTo, withBeginningBalance === "true", year);
    const printer = new PdfPrinter(pmFonts);

    const docDefinition = printAuditTrailReportPDF(result.entries, result.beginningBalance, dateFrom, dateTo);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed g/l audit trail report`,
      resource: `general ledger`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.exportAuditTrail = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, codeFrom, codeTo, withBeginningBalance, year = null } = req.query;
    const result = await reportService.print_activity_report(dateFrom, dateTo, codeFrom, codeTo, withBeginningBalance === "true", year);

    const excelBuffer = exportAuditTrailReporExcel(result.entries, result.beginningBalance, dateFrom, dateTo);
    res.setHeader("Content-Disposition", 'attachment; filename="gl-audit-trail-report.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported g/l audit trail`,
      resource: `general ledger`,
    });

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};
