const PdfPrinter = require("pdfmake");
const XLSX = require("xlsx");
const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const WeeklySaving = require("./weekly-saving.schema.js");
const weeklySavingService = require("./weekly-saving.service.js");
const { pmFonts } = require("../../constants/fonts.js");
const { generateWeeklySavingsPDF } = require("./print/print_all.js");
const { formatNumber } = require("../../utils/number.js");
const { completeNumberDate } = require("../../utils/date.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const { getToken } = require("../../utils/get-token.js");

exports.getWeeklySavings = async (req, res, next) => {
  try {
    const { page, limit, search, sort } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const validatedSort = ["to-asc", "to-desc", "from-asc", "from-desc"].includes(sort) ? sort : "";
    const result = await weeklySavingService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search), validatedSort);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getWeeklySaving = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await weeklySavingService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createWeeklySaving = async (req, res, next) => {
  try {
    const result = await weeklySavingService.create(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateWeeklySaving = async (req, res, next) => {
  try {
    const token = getToken(req);
    const filter = { _id: req.params.id };
    const result = await weeklySavingService.update(filter, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteWeeklySaving = async (req, res, next) => {
  try {
    const token = getToken(req);
    const filter = { _id: req.params.id };
    const result = await weeklySavingService.delete(filter, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.printAll = async (req, res, next) => {
  try {
    const printer = new PdfPrinter(pmFonts);

    const weeklySavings = await WeeklySaving.find({ deletedAt: null }).sort({ rangeAmountFrom: 1 }).lean().exec();

    const docDefinition = generateWeeklySavingsPDF(weeklySavings);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const token = getToken(req);
    await activityLogServ.create({
      author: token._id,
      username: token.username,
      activity: `printed all weekly savings`,
      resource: `weekly savings`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.exportAll = async (req, res, next) => {
  try {
    const weeklySavings = await WeeklySaving.find({ deletedAt: null }).sort({ rangeAmountFrom: 1 }).lean().exec();
    const datas = weeklySavings.map(e => ({
      "Range Amount From": formatNumber(e.rangeAmountFrom),
      "Range Amount To": formatNumber(e.rangeAmountTo),
      "Weekly Savings Fund": formatNumber(e.weeklySavingsFund),
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(datas, { origin: "A7" });

    worksheet["!cols"] = [{ wch: 30 }, { wch: 30 }, { wch: 30 }];

    const headerTitle = "KAALALAY FOUNDATION, INC. (LB)";
    const headerSubtitle = "Weekly Savings Table";
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

    XLSX.utils.book_append_sheet(workbook, worksheet, "Weekly Savings");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    res.setHeader("Content-Disposition", 'attachment; filename="weekly-savings.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const token = getToken(req);
    await activityLogServ.create({
      author: token._id,
      username: token.username,
      activity: `exported all weekly savings`,
      resource: `weekly savings`,
    });

    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};
