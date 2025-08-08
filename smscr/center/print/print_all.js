const { completeNumberDate } = require("../../../utils/date");

exports.generateCenterPDF = datas => {
  const info = {
    title: "Centers",
  };

  const centers = datas.map(data => [
    { text: data.centerNo, fontSize: 7, margin: [0, 1, 0, 1] },
    { text: data.description, fontSize: 7, margin: [0, 1, 0, 1] },
    { text: data.location, fontSize: 7, margin: [0, 1, 0, 1] },
    { text: data.centerChief, fontSize: 7, margin: [0, 1, 0, 1] },
    { text: data.treasurer, fontSize: 7, margin: [0, 1, 0, 1] },
    { text: data.acctOfficer, fontSize: 7, margin: [0, 1, 0, 1] },
    { text: data.activeNew, fontSize: 7, margin: [0, 1, 0, 1], alignment: "center" },
    { text: data.activeReturnee, fontSize: 7, margin: [0, 1, 0, 1], alignment: "center" },
    { text: data.activeExisting, fontSize: 7, margin: [0, 1, 0, 1], alignment: "center" },
    { text: data.activePastdue, fontSize: 7, margin: [0, 1, 0, 1], alignment: "center" },
    { text: data.resigned, fontSize: 7, margin: [0, 1, 0, 1], alignment: "center" },
    { text: data.others, fontSize: 7, margin: [0, 1, 0, 1], alignment: "center" },
    { text: data.total, fontSize: 7, margin: [0, 1, 0, 1], alignment: "center" },
  ]);

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "Centers", fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["6%", "15%", "19%", "8%", "8%", "8%", "5%", "5.5%", "5%", "5%", "5.5%", "5%", "5%"],
        body: [
          [
            { text: "Center No.", fontSize: 8, bold: true, margin: [0, 5, 0, 0] },
            { text: "Center Name", fontSize: 8, bold: true, margin: [0, 5, 0, 0] },
            { text: "Location", fontSize: 8, bold: true, margin: [0, 5, 0, 0] },
            { text: "Center Chief", fontSize: 8, bold: true, margin: [0, 5, 0, 0] },
            { text: "Treasurer", fontSize: 8, bold: true, margin: [0, 5, 0, 0] },
            { text: "Account Officer", fontSize: 8, bold: true },
            { text: "Active New", fontSize: 8, bold: true, alignment: "center" },
            { text: "Active Returnee", fontSize: 8, bold: true, alignment: "center" },
            { text: "Active Existing", fontSize: 8, bold: true, alignment: "center" },
            { text: "Active PastDue", fontSize: 8, bold: true, alignment: "center" },
            { text: "Resigned", fontSize: 8, bold: true, alignment: "center", margin: [0, 5, 0, 0] },
            { text: "Others", fontSize: 8, bold: true, alignment: "center", margin: [0, 5, 0, 0] },
            { text: "Total", fontSize: 8, bold: true, alignment: "center", margin: [0, 5, 0, 0] },
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
