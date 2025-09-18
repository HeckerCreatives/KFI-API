const customerService = require("./customer.service.js");
const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const PdfPrinter = require("pdfmake");
const XLSX = require("xlsx-js-style");
const { generatePrintAllCustomers } = require("./print/print_all.js");
const { pmFonts } = require("../../constants/fonts.js");
const { completeNumberDate } = require("../../utils/date.js");
const activityLogServ = require("../activity-logs/activity-log.service.js");
const { getToken } = require("../../utils/get-token.js");
const { isValidObjectId, default: mongoose } = require("mongoose");
const { formatNumber } = require("../../utils/number.js");
const { capitalize } = require("../../utils/letters.js");
const CustomError = require("../../utils/custom-error.js");

exports.getClientsByCenter = async (req, res, next) => {
  try {
    const { center } = req.params;
    if (!isValidObjectId(center)) throw new CustomError("Invalid center id");
    const result = await customerService.get_clients_by_center(center);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getClientStats = async (req, res, next) => {
  try {
    const result = await customerService.get_client_stats();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getNameLists = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);

    const result = await customerService.get_clients_list(stringEscape(search), validatedLimit, validatedPage, validatedOffset);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getSelections = async (req, res, next) => {
  try {
    const { page, limit, keyword, center } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const validatedCenter = isValidObjectId(center) ? center : "";

    const result = await customerService.get_selections(stringEscape(keyword), validatedCenter, validatedLimit, validatedPage, validatedOffset);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getCustomers = async (req, res, next) => {
  try {
    const { page, limit, search, sort } = req.query;
    const { validatedLimit, validatedOffset, validatedPage } = validatePaginationParams(limit, page);
    const validatedSort = ["acctno-asc", "acctno-desc", "name-asc", "name-desc"].includes(sort) ? sort : "";
    const result = await customerService.get_all(validatedLimit, validatedPage, validatedOffset, stringEscape(search), validatedSort);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getCustomer = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, deletedAt: null };
    const result = await customerService.get_single(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.createCustomer = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new CustomError("Please select an image.", 400, [{ path: "clientImage", msgs: ["Please select an image."] }]));
    }

    const token = getToken(req);
    const result = await customerService.create(req.body, req.file, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const token = getToken(req);
    const filter = { _id: req.params.id };
    const result = await customerService.update(filter, req.body, req.file, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    const token = getToken(req);
    const filter = { _id: req.params.id };
    const result = await customerService.delete(filter, token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.printAll = async (req, res, next) => {
  try {
    const printer = new PdfPrinter(pmFonts);

    const clients = await customerService.printAll({ deletedAt: null });

    const docDefinition = generatePrintAllCustomers(clients);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `printed all clients`,
      resource: `clients`,
    });

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.print = async (req, res, next) => {
  try {
    const printer = new PdfPrinter(pmFonts);

    const clients = await customerService.printAll({ deletedAt: null, _id: new mongoose.Types.ObjectId(req.params.id) });

    if (clients) {
      const docDefinition = generatePrintAllCustomers(clients);
      const pdfDoc = printer.createPdfKitDocument(docDefinition);

      res.setHeader("Content-Type", "application/pdf");

      const author = getToken(req);

      await activityLogServ.create({
        author: author._id,
        username: author.username,
        activity: `printed a client profile`,
        resource: `clients`,
        dataId: clients[0].clients[0]._id,
      });

      pdfDoc.pipe(res);
      pdfDoc.end();
      return;
    }
    return res.status(500).json(clients);
  } catch (error) {
    next(error);
  }
};

exports.exportAll = async (req, res, next) => {
  try {
    const clients = await customerService.printAll({ deletedAt: null });

    const datas = [
      [
        "Center No",
        "Account Officer",
        "Name",
        "Account No",
        "Loan Amount",
        "Address",
        "Contact No",
        "B-Day",
        "B-Place",
        "Status",
        "Sex",
        "Nature of Business",
        "Position",
        "Status Active/Drop-Out",
        "Cycle",
      ],
    ];

    clients.map(item => {
      let totalLoanAmounts = 0;
      item.clients.map(data => {
        if (data.entries) totalLoanAmounts += data.totalLoan;
        datas.push([
          data.center.centerNo,
          data.acctOfficer,
          data.name,
          data.acctNumber,
          formatNumber(data.totalLoan),
          data.address,
          data.mobileNo,
          completeNumberDate(data.birthdate),
          data.birthplace,
          capitalize(data.civilStatus),
          capitalize(data.sex),
          data.business.type,
          data.position,
          data.memberStatus,
          data.entries ? data.entries.cycle : 0,
        ]);
      });
      datas.push([
        "Total:",
        "",
        "",
        "",
        { v: `${formatNumber(totalLoanAmounts)}`, s: { border: { top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } } } } },
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]);
      datas.push(Array(Array.from(15)).fill(""));
    });

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported all clients`,
      resource: `clients`,
    });

    export_excel(datas, res);
  } catch (error) {
    next(error);
  }
};

exports.export = async (req, res, next) => {
  try {
    const clients = await customerService.printAll({ deletedAt: null, _id: new mongoose.Types.ObjectId(req.params.id) });

    const datas = [
      [
        "Center No",
        "Account Officer",
        "Name",
        "Account No",
        "Loan Amount",
        "Address",
        "Contact No",
        "B-Day",
        "B-Place",
        "Status",
        "Sex",
        "Nature of Business",
        "Position",
        "Status Active/Drop-Out",
        "Cycle",
      ],
    ];

    clients.map(item => {
      let totalLoanAmounts = 0;
      item.clients.map(data => {
        if (data.entries) totalLoanAmounts += data.totalLoan;
        datas.push([
          data.center.centerNo,
          data.acctOfficer,
          data.name,
          data.acctNumber,
          formatNumber(data.totalLoan),
          data.address,
          data.mobileNo,
          completeNumberDate(data.birthdate),
          data.birthplace,
          capitalize(data.civilStatus),
          capitalize(data.sex),
          data.business.type,
          data.position,
          data.memberStatus,
          data.entries ? data.entries.cycle : 0,
        ]);
      });
      datas.push(["", "", "", "", { v: `${formatNumber(totalLoanAmounts)}`, s: { font: { bold: true, sz: 12 } } }, "", "", "", "", "", "", "", "", "", ""]);
    });

    const author = getToken(req);
    await activityLogServ.create({
      author: author._id,
      username: author.username,
      activity: `exported a client`,
      resource: `clients`,
      dataId: clients[0].clients[0]._id,
    });

    export_excel(datas, res);
  } catch (error) {
    next(error);
  }
};

const export_excel = (datas, res) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(datas, { origin: "A7" });

  worksheet["!cols"] = Array.from(Array(15)).fill({ wch: 20 });

  const headerTitle = "KAALALAY FOUNDATION, INC. (LB)";
  const headerSubtitle = "Clients Profile";
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [dateTitle], []], { origin: "A2" });

  if (!worksheet["A2"]) worksheet["A2"] = {};
  worksheet["A2"].s = { font: { bold: true, sz: 12 } };

  if (!worksheet["A3"]) worksheet["A3"] = {};
  worksheet["A3"].s = { font: { bold: false, sz: 12 } };

  if (!worksheet["A4"]) worksheet["A4"] = {};
  worksheet["A4"].s = { font: { bold: false, sz: 12 } };

  const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"];
  letters.map(letter => {
    if (!worksheet[`${letter}7`]) worksheet[`${letter}7`] = {};
    worksheet[`${letter}7`].s = { border: { bottom: { style: "medium", color: { rgb: "000000" } } } };
  });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  res.setHeader("Content-Disposition", 'attachment; filename="clients.xlsx"');
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  return res.send(excelBuffer);
};
