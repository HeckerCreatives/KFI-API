const PdfPrinter = require("pdfmake");
const XLSX = require("xlsx");
const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const centerService = require("./center.service.js");
const Center = require("./center.schema.js");
const { generateCenterPDF } = require("./print/print_all.js");
const { pmFonts } = require("../../constants/fonts.js");
const { completeNumberDate } = require("../../utils/date.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const { getToken } = require("../../utils/get-token.js");

exports.getDescription = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await centerService.get_single(filter);
    return res.status(200).json({ success: result.success, description: result.center.description });
  } catch (error) {
    next(error);
  }
};

exports.getSelections = async (req, res, next) => {
  try {
    const { page, limit, keyword: search } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await centerService.get_selections(stringEscape(search), validatedLimit, validatedPage, validatedOffset);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getOptions = async (req, res, next) => {
  try {
    const result = await centerService.get_options();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getCenters = async (req, res, next) => {
  try {
    const { page, limit, search, sort } = req.query;
    const validatedSort = ["centerno-asc", "centerno-desc", "description-asc", "description-desc"].includes(sort) ? sort : "";
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const result = await centerService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search), validatedSort);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getCenter = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await centerService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createCenter = async (req, res, next) => {
  try {
    const token = getToken(req);
    const result = await centerService.create(req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateCenter = async (req, res, next) => {
  try {
    const token = getToken(req);
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await centerService.update(filter, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteCenter = async (req, res, next) => {
  try {
    const token = getToken(req);
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await centerService.delete(filter, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.printAll = async (req, res, next) => {
  try {
    const printer = new PdfPrinter(pmFonts);

    const centers = await centerService.print_all();

    const docDefinition = generateCenterPDF(centers.centers);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed all centers`,
      resource: `center`,
    });

    res.setHeader("Content-Type", "application/pdf");
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.exportAll = async (req, res, next) => {
  try {
    const centers = await centerService.print_all();

    const toExports = centers.centers.map(center => ({
      "Center Number": center.centerNo,
      "Center Name": center.description,
      Location: center.location,
      "Center Chief": center.centerChief,
      Treasurer: center.treasurer,
      "Account Officer": center.acctOfficer,
      "Active New": center.activeNew,
      "Active Returnee": center.activeReturnee,
      "Active Existing": center.activeExisting,
      "Active PastDue": center.activePastdue,
      Resigned: center.resigned,
      Others: center.others,
      Total: center.total,
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(toExports, { origin: "A7" });

    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 30 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 13 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
    ];

    const headerTitle = "KAALALAY FOUNDATION, INC. (LB)";
    const headerSubtitle = "Centers";
    const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

    XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [dateTitle], []], { origin: "A2" });

    if (!worksheet["A2"]) worksheet["A2"] = {};
    worksheet["A2"].s = {
      font: { bold: true, sz: 20 },
      alignment: { horizontal: "center" },
    };

    if (!worksheet["A3"]) worksheet["A3"] = {};
    worksheet["A3"].s = {
      font: { italic: true, sz: 12 },
      alignment: { horizontal: "center" },
    };

    XLSX.utils.book_append_sheet(workbook, worksheet, "Centers");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    res.setHeader("Content-Disposition", 'attachment; filename="centers.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported all centers`,
      resource: `center`,
    });

    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};
