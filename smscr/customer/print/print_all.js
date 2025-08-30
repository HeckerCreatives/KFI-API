const { completeNumberDate } = require("../../../utils/date");
const { capitalize } = require("../../../utils/letters");
const { formatNumber } = require("../../../utils/number");

exports.generatePrintAllCustomers = datas => {
  const info = {
    title: "Clients",
  };

  const clients = [];

  datas.map(item => {
    let totalLoanAmounts = 0;
    item.clients.map(data => {
      if (data.entries) totalLoanAmounts += data.totalLoan;
      clients.push([
        { text: data.center.centerNo, fontSize: 8 },
        { text: data.acctOfficer, fontSize: 8 },
        { text: data.name, fontSize: 8 },
        { text: data.acctNumber, fontSize: 8 },
        { text: formatNumber(data.totalLoan), fontSize: 8, alignment: "right" },
        { text: data.address, fontSize: 8 },
        { text: data.mobileNo, fontSize: 8 },
        { text: completeNumberDate(data.birthdate), fontSize: 8 },
        { text: data.birthplace, fontSize: 8 },
        { text: capitalize(data.civilStatus), fontSize: 8 },
        { text: capitalize(data.sex), fontSize: 8 },
        { text: data.business.type, fontSize: 8 },
        { text: data.position, fontSize: 8 },
        { text: data.memberStatus, fontSize: 8 },
        { text: data.entries ? data.entries.cycle : 0, fontSize: 8 },
      ]);
    });
    clients.push([{}, {}, {}, {}, { text: formatNumber(totalLoanAmounts), fontSize: 8, alignment: "right" }, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}]);
  });

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "Clients Profile", fontSize: 9 },
    { text: `Date Printed: ${completeNumberDate(new Date())}`, fontSize: 9, margin: [0, 0, 0, 8] },
    {
      table: {
        widths: ["6.6%", "6.6%", "6.6%", "6.6%", "6.6%", "6.6%", "6.6%", "6.6%", "6.6%", "6.6%", "6.6%", "6.6%", "6.6%", "6.6%", "6.6%"],
        body: [
          [
            { text: "Center No", style: "headerStyle", margin: [0, 8, 0, 0] },
            { text: "Account Officer", style: "headerStyle", margin: [0, 4, 0, 0] },
            { text: "Name", style: "headerStyle", margin: [0, 8, 0, 0] },
            { text: "Account No", style: "headerStyle", margin: [0, 8, 0, 0] },
            { text: "Loan Amount", style: "headerStyle", margin: [0, 4, 0, 0] },
            { text: "Address", style: "headerStyle", margin: [0, 8, 0, 0] },
            { text: "Contact No.", style: "headerStyle", margin: [0, 8, 0, 0] },
            { text: "B-Day", style: "headerStyle", margin: [0, 8, 0, 0] },
            { text: "B-Place", style: "headerStyle", margin: [0, 8, 0, 0] },
            { text: "Status", style: "headerStyle", margin: [0, 8, 0, 0] },
            { text: "Sex", style: "headerStyle", margin: [0, 8, 0, 0] },
            { text: "Nature of Business", style: "headerStyle", margin: [0, 4, 0, 0] },
            { text: "Position", style: "headerStyle", margin: [0, 8, 0, 0] },
            { text: "Status Active/Drop-Out", style: "headerStyle" },
            { text: "Cycle", style: "headerStyle", margin: [0, 8, 0, 0] },
          ],
          ...clients,
        ],
      },
    },
  ];

  const styles = {
    headerStyle: { fontSize: 8, bold: true, alignment: "left" },
  };

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
