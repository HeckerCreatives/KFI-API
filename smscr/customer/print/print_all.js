const { completeNumberDate } = require("../../../utils/date");

exports.generatePrintAllCustomers = datas => {
  const info = {
    title: "Clients",
  };

  const clients = datas.map(data => [
    { text: data.acctNumber, fontSize: 8, margin: [0, 1, 0, 1] },
    { text: data.name, fontSize: 8, margin: [0, 1, 0, 1] },
    { text: data.groupNumber.code, fontSize: 8, margin: [0, 1, 0, 1] },
    { text: data.center.centerNo, fontSize: 8, margin: [0, 1, 0, 1] },
    { text: data.business.type, fontSize: 8, margin: [0, 1, 0, 1] },
    { text: data.acctOfficer, fontSize: 8, margin: [0, 1, 0, 1] },
    { text: data.newStatus, fontSize: 8, margin: [0, 1, 0, 1] },
    { text: data.address, fontSize: 8, margin: [0, 1, 0, 1] },
    { text: data.city, fontSize: 8, margin: [0, 1, 0, 1] },
    { text: data.zip, fontSize: 8, margin: [0, 1, 0, 1] },
    { text: data.telNo, fontSize: 8, margin: [0, 1, 0, 1] },
    { text: data.mobileNo, fontSize: 8, margin: [0, 1, 0, 1] },
  ]);

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "Clients", fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*"],
        body: [
          [
            { text: "Account No", fontSize: 9, bold: true, margin: [0, 4.5, 0, 0] },
            { text: "Name", fontSize: 9, bold: true, margin: [0, 4.5, 0, 0] },
            { text: "Group No", fontSize: 9, bold: true, margin: [0, 4.5, 0, 0] },
            { text: "Center No", fontSize: 9, bold: true, margin: [0, 4.5, 0, 0] },
            { text: "Business Type", fontSize: 9, bold: true },
            { text: "Account Officer", fontSize: 9, bold: true },
            { text: "New Status", fontSize: 9, bold: true, margin: [0, 4.5, 0, 0] },
            { text: "Address", fontSize: 9, bold: true, margin: [0, 4.5, 0, 0] },
            { text: "City", fontSize: 9, bold: true, margin: [0, 4.5, 0, 0] },
            { text: "Zip Code", fontSize: 9, bold: true, margin: [0, 4.5, 0, 0] },
            { text: "Telephone No", fontSize: 9, bold: true, margin: [0, 4.5, 0, 0] },
            { text: "Mobile No", fontSize: 9, bold: true, margin: [0, 4.5, 0, 0] },
          ],
          ...clients,
        ],
      },
    },
  ];

  const styles = [];

  const footer = function (currentPage, pageCount) {
    return {
      text: `Page ${currentPage} of ${pageCount}`,
      alignment: "right",
      fontSize: 8,
      margin: [0, 5, 20, 0],
    };
  };

  return {
    info: info,
    pageOrientation: "landscape",
    footer: footer,
    pageMargins: [20, 25, 20, 25],
    content: contents,
    styles: styles,
    defaultStyle: {
      font: "Roboto",
    },
  };
};
