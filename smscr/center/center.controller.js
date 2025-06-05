const PdfPrinter = require("pdfmake");
const XLSX = require("xlsx");
const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const centerService = require("./center.service.js");
const Center = require("./center.schema.js");
const { generateCenterPDF } = require("./print/print_all.js");
const { pmFonts } = require("../../constants/fonts.js");
const { completeNumberDate } = require("../../utils/date.js");

exports.getSelections = async (req, res, next) => {
  try {
    const { keyword } = req.query;
    const result = await centerService.get_selections(stringEscape(keyword));
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
    console.log(error);
    next(error);
  }
};

exports.createCenter = async (req, res, next) => {
  try {
    const result = await centerService.create(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateCenter = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await centerService.update(filter, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteCenter = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await centerService.delete(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.printAll = async (req, res, next) => {
  try {
    const printer = new PdfPrinter(pmFonts);

    const centers = await Center.find({ deletedAt: null }).sort({ createdAt: -1 }).lean().exec();

    const docDefinition = generateCenterPDF(centers);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.exportAll = async (req, res, next) => {
  try {
    const centers = await Center.find(
      { deletedAt: null },
      {
        "Center Number": "$centerNo",
        "Center Name": "$description",
        Location: "$location",
        "Center Chief": "$centerChief",
        Treasurer: "$treasurer",
        "Account Officer": "$acctOfficer",
        _id: 0,
      }
    )
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(centers, { origin: "A7" });

    worksheet["!cols"] = [{ wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

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

    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};
