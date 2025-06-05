const customerService = require("./customer.service.js");
const { stringEscape } = require("../../utils/escape-string.js");
const { validatePaginationParams } = require("../../utils/paginate-validate.js");
const Customer = require("./customer.schema.js");
const PdfPrinter = require("pdfmake");
const XLSX = require("xlsx");
const { generatePrintAllCustomers } = require("./print/print_all.js");
const { pmFonts } = require("../../constants/fonts.js");
const { completeNumberDate } = require("../../utils/date.js");

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
    console.log(error);
    next(error);
  }
};

exports.createCustomer = async (req, res, next) => {
  try {
    const result = await customerService.create(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await customerService.update(filter, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    const result = await customerService.delete(filter);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.printAll = async (req, res, next) => {
  try {
    const printer = new PdfPrinter(pmFonts);

    const clients = await Customer.find({ deletedAt: null })
      .populate({ path: "center", select: "centerNo" })
      .populate({ path: "business", select: "type" })
      .populate({ path: "beneficiaries" })
      .populate({ path: "children" })
      .populate({ path: "groupNumber" })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const docDefinition = generatePrintAllCustomers(clients);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    next(error);
  }
};

exports.print = async (req, res, next) => {
  try {
    const printer = new PdfPrinter(pmFonts);

    const clients = await customerService.get_single({ _id: req.params.id, deletedAt: null });

    if (clients.success) {
      const docDefinition = generatePrintAllCustomers([clients.customer]);
      const pdfDoc = printer.createPdfKitDocument(docDefinition);

      res.setHeader("Content-Type", "application/pdf");
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
    const clients = await Customer.find({ deletedAt: null })
      .populate({ path: "center", select: "centerNo" })
      .populate({ path: "business", select: "type" })
      .populate({ path: "beneficiaries" })
      .populate({ path: "children" })
      .populate({ path: "groupNumber" })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const formattedClients = clients.map(client => ({
      "Account No": client.acctNumber,
      Name: client.name,
      "Group No": client.groupNumber?.code || "", // Handle potential null
      "Center No": client.center?.centerNo || "",
      "Business Type": client.business?.type || "",
      "Account Officer": client.acctOfficer,
      "New Status": client.newStatus,
      Address: client.address,
      City: client.city,
      "Zip Code": client.zipCode,
      "Telephone No": client.telNo,
      "Mobile No": client.mobileNo,
    }));

    export_excel(formattedClients, res);
  } catch (error) {
    next(error);
  }
};

exports.export = async (req, res, next) => {
  try {
    const client = await customerService.get_single({ _id: req.params.id, deletedAt: null });

    if (client.success) {
      const formattedClients = {
        "Account No": client.customer.acctNumber,
        Name: client.customer.name,
        "Group No": client.customer.groupNumber?.code || "",
        "Center No": client.customer.center?.centerNo || "",
        "Business Type": client.customer.business?.type || "",
        "Account Officer": client.customer.acctOfficer,
        "New Status": client.customer.newStatus,
        Address: client.customer.address,
        City: client.customer.city,
        "Zip Code": client.customer.zipCode,
        "Telephone No": client.customer.telNo,
        "Mobile No": client.customer.mobileNo,
      };
      export_excel([formattedClients], res);
      return;
    }

    return res.status(500).json(client);
  } catch (error) {
    next(error);
  }
};

const export_excel = (datas, res) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(datas, { origin: "A7" });

  worksheet["!cols"] = Array.from(Array(12)).fill({ wch: 20 });

  const headerTitle = "KAALALAY FOUNDATION, INC. (LB)";
  const headerSubtitle = "Clients";
  const dateTitle = `Date Printed: ${completeNumberDate(new Date())}`;

  XLSX.utils.sheet_add_aoa(worksheet, [[headerTitle], [headerSubtitle], [dateTitle], []], { origin: "A2" });

  if (!worksheet["A2"]) worksheet["A2"] = {};
  worksheet["A2"].s = {
    font: { bold: true, sz: 20 },
    alignment: { horizontal: "client" },
  };

  if (!worksheet["A3"]) worksheet["A3"] = {};
  worksheet["A3"].s = {
    font: { italic: true, sz: 12 },
    alignment: { horizontal: "client" },
  };

  XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  res.setHeader("Content-Disposition", 'attachment; filename="clients.xlsx"');
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  return res.send(excelBuffer);
};
