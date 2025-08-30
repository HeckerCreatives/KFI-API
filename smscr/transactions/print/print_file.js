exports.printFile = (payTo, loanRelease, entries) => {
  const info = {
    title: "Loan Release",
  };

  const contents = [
    { text: "KAALALAY FOUNDATION, INC (LB)", fontSize: 12, bold: true },
    { text: "10001 Mt. Halcon St. , Umali Subd.", fontSize: 9 },
    { text: "Batong Malake, Los Baños, Laguna", fontSize: 9 },
    { text: "Tel. No. (049) 536-4501", fontSize: 9 },
    { text: "", fontSize: 9 },
    { text: "CHECK VOUCHER (LOAN RELEASE)", fontSize: 9 },
    { text: "", fontSize: 9 },
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
