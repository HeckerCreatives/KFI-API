const PdfPrinter = require("pdfmake");
const XLSX = require("xlsx");
const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const chartOfAccountService = require("./chart-of-account.service.js");
const { generateChartOfAccountPDF } = require("./print/print_all.js");
const ChartOfAccount = require("./chart-of-account.schema.js");
const { pmFonts } = require("../../constants/fonts.js");
const { completeNumberDate } = require("../../utils/date.js");
const { getToken } = require("../../utils/get-token.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");

exports.getAllNoPagination = async (req, res, next) => {
  try {
    const result = await chartOfAccountService.get_all_no_pagination();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getSelections = async (req, res, next) => {
  try {
    const { page, limit, keyword, center } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);

    const result = await chartOfAccountService.get_selections(stringEscape(keyword), validatedLimit, validatedPage, validatedOffset);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getChartOfAccounts = async (req, res, next) => {
  try {
    const { page, limit, search, sort } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const validatedSort = ["code-asc", "code-desc", "description-asc", "description-desc"].includes(sort) ? sort : "";
    const result = await chartOfAccountService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search), validatedSort);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getChartOfAccount = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await chartOfAccountService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createChartOfAccount = async (req, res, next) => {
  try {
    const result = await chartOfAccountService.create(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateChartOfAccount = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await chartOfAccountService.update(filter, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteChartOfAccount = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await chartOfAccountService.delete(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.linkGroupOfAccount = async (req, res, next) => {
  try {
    const token = getToken(req);
    const filter = { _id: req.params.id, deleteAt: null };
    const result = await chartOfAccountService.link(filter, req.body, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.printAll = async (req, res, next) => {
  try {
    const printer = new PdfPrinter(pmFonts);

    const chartOfAccounts = await ChartOfAccount.find({ deletedAt: null }).sort({ createdAt: -1 }).lean().exec();

    const docDefinition = generateChartOfAccountPDF(chartOfAccounts);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    const token = getToken(req);
    await activityLogServ.create({
      author: token._id,
      username: token.username,
      activity: `printed all chart of accounts`,
      resource: `chart of account`,
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
    const chartOfAccounts = await ChartOfAccount.find(
      { deletedAt: null },
      {
        "Account Code": "$code",
        "Account Description": "$description",
        "Nature of Account": "$nature",
        Classification: "$classification",
        "Department Status": "$deptStatus",
        _id: 0,
      }
    )
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(chartOfAccounts, { origin: "A7" });

    worksheet["!cols"] = [{ wch: 15 }, { wch: 50 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

    const headerTitle = "KAALALAY FOUNDATION, INC. (LB)";
    const headerSubtitle = "Chart of Accounts";
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

    XLSX.utils.book_append_sheet(workbook, worksheet, "Chart Of Account");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    res.setHeader("Content-Disposition", 'attachment; filename="chart-of-accounts.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    const token = getToken(req);
    await activityLogServ.create({
      author: token._id,
      username: token.username,
      activity: `exported all chart of accounts`,
      resource: `chart of account`,
    });

    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};
