const { completeNumberDate } = require("../../../utils/date");

exports.generateChartOfAccountPDF = datas => {
  const info = {
    title: "Chart of Accounts",
  };

  const chartOfAccounts = datas.map(data => [
    { text: data.code, fontSize: 8, margin: [0, 1, 0, 1] },
    { text: data.description, fontSize: 8, margin: [0, 1, 0, 1] },
    { text: data.nature, fontSize: 8, margin: [0, 1, 0, 1] },
    { text: data.classification, fontSize: 8, margin: [0, 1, 0, 1] },
    { text: data.deptStatus, fontSize: 8, margin: [0, 1, 0, 1] },
  ]);

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "Chart Of Accounts", fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["12%", "52%", "12%", "12%", "12%"],
        body: [
          [
            { text: "Account Code", fontSize: 9, bold: true, margin: [0, 8, 0, 0] },
            { text: "Account Description", fontSize: 9, bold: true, margin: [0, 8, 0, 0] },
            { text: "Nature of Account", fontSize: 9, bold: true },
            { text: "Classification", fontSize: 9, bold: true, margin: [0, 8, 0, 0] },
            { text: "Department Status", fontSize: 9, bold: true },
          ],
          ...chartOfAccounts,
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
