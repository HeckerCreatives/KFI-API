const { completeNumberDate } = require("../../../utils/date");

exports.generateCenterPDF = datas => {
  const info = {
    title: "Centers",
  };

  const centers = datas.map(data => [
    { text: data.centerNo, fontSize: 8, margin: [0, 1, 0, 1] },
    { text: data.description, fontSize: 8, margin: [0, 1, 0, 1] },
    { text: data.location, fontSize: 8, margin: [0, 1, 0, 1] },
    { text: data.centerChief, fontSize: 8, margin: [0, 1, 0, 1] },
    { text: data.treasurer, fontSize: 8, margin: [0, 1, 0, 1] },
    { text: data.acctOfficer, fontSize: 8, margin: [0, 1, 0, 1] },
  ]);

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "Centers", fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["10%", "22.5%", "22.5%", "15%", "15%", "15%"],
        body: [
          [
            { text: "Center No.", fontSize: 9, bold: true },
            { text: "Center Name", fontSize: 9, bold: true },
            { text: "Location", fontSize: 9, bold: true },
            { text: "Center Chief", fontSize: 9, bold: true },
            { text: "Treasurer", fontSize: 9, bold: true },
            { text: "Account Officer", fontSize: 9, bold: true },
          ],
          ...centers,
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
    footer: footer,
    pageMargins: [20, 25, 20, 25],
    content: contents,
    styles: styles,
    defaultStyle: {
      font: "Roboto",
    },
  };
};
