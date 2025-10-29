const { completeNumberDate } = require("../../../utils/date");
const { formatNumber } = require("../../../utils/number");

const setValue = (entries, code) => {
  code = typeof code === "string" ? [code] : code;
  const value = entries.find(e => code.includes(e.acctCode.code));
  return value ? formatNumber(value?.debit || value?.credit) : "";
};

const getValue = (entries, code) => {
  code = typeof code === "string" ? [code] : code;
  const value = entries.find(e => code.includes(e.acctCode.code));
  return Number(value ? value?.debit || value?.credit : 0);
};

exports.printClientSOA = ({ payments, client, principal, loanRelease }) => {
  const info = { title: "Client SOA" };

  let rows = [];
  let totalPrincipal = Number(principal?.credit || principal?.debit);

  let accTotal = 0;
  let accPrincipal = 0;
  let accInterest = 0;
  let accWSF = 0;

  payments.map(payment => {
    if (payment.ors.length > 0) {
      accInterest += getValue(payment.ors, "4045");
      rows.push([
        { text: `${completeNumberDate(payment.date)}`, style: "cellStyle", border: [0, 0, 0, 0], alignment: "left" },
        { text: `${payment.week}`, style: "cellStyle", border: [0, 0, 0, 0], alignment: "center" },
        { text: `${payment.ors[0].acknowledgement.code}`, style: "cellStyle", border: [0, 0, 0, 0], alignment: "left" },
        { text: `${completeNumberDate(payment.ors[0].acknowledgement.date)}`, style: "cellStyle", border: [0, 0, 0, 0], alignment: "left" },
        { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "left" },
        { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "right" },
        { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "right" },
        { text: `${setValue(payment.ors, "4045")}`, style: "cellStyle", border: [0, 0, 0, 0], alignment: "right" },
        { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "right" },
        { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "right" },
      ]);
    }

    if (payment.ars.length > 0) {
      totalPrincipal -= getValue(payment.ars, ["2000B", "2000A"]);
      totalPayment = payment.ars.reduce((acc, obj) => acc + Number(obj?.debit || obj?.credit), 0);

      accTotal += Number(totalPayment);
      accPrincipal += getValue(payment.ars, ["2000B", "2000A"]);
      accInterest += getValue(payment.ars, "4045");
      accWSF += getValue(payment.ars, "2010C");

      rows.push([
        { text: `${completeNumberDate(payment.date)}`, style: "cellStyle", border: [0, 0, 0, 0], alignment: "left" },
        { text: `${payment.week}`, style: "cellStyle", border: [0, 0, 0, 0], alignment: "center" },
        { text: `${payment.ars[0].release.code}`, style: "cellStyle", border: [0, 0, 0, 0], alignment: "left" },
        { text: `${completeNumberDate(payment.ars[0].release.date)}`, style: "cellStyle", border: [0, 0, 0, 0], alignment: "left" },
        { text: `${formatNumber(totalPayment)}`, style: "cellStyle", border: [0, 0, 0, 0], alignment: "right" },
        { text: `${setValue(payment.ars, ["2000B", "2000A"])}`, style: "cellStyle", border: [0, 0, 0, 0], alignment: "right" },
        { text: `${formatNumber(totalPrincipal)}`, style: "cellStyle", border: [0, 0, 0, 0], alignment: "right" },
        { text: `${setValue(payment.ars, "4045")}`, style: "cellStyle", border: [0, 0, 0, 0], alignment: "right" },
        { text: `${setValue(payment.ars, "2010C")}`, style: "cellStyle", border: [0, 0, 0, 0], alignment: "right" },
        { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "right" },
      ]);
    }

    if (payment.ars.length < 1 && payment.ors.length < 1) {
      rows.push([
        { text: `${completeNumberDate(payment.date)}`, style: "cellStyle", border: [0, 0, 0, 0], alignment: "left" },
        { text: `${payment.week}`, style: "cellStyle", border: [0, 0, 0, 0], alignment: "center" },
        { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "left" },
        { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "left" },
        { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "left" },
        { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "right" },
        { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "right" },
        { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "right" },
        { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "right" },
        { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "right" },
      ]);
    }
  });

  rows.push([
    { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "left" },
    { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "center" },
    { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "left" },
    { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "left" },
    { text: `${formatNumber(accTotal)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(accPrincipal)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "right" },
    { text: `${formatNumber(accInterest)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: `${formatNumber(accWSF)}`, style: "cellStyle", border: [0, 1, 0, 1], alignment: "right" },
    { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "right" },
  ]);

  const contents = [
    { text: "STATEMENT OF ACCOUNTS", fontSize: 10, bold: true },
    {
      table: {
        widths: ["10%", "30%"],
        body: [
          [
            { text: "Name of Client", fontSize: 8, border: [0, 0] },
            { text: `${client.name}`, fontSize: 8, border: [0, 0] },
          ],
          [
            { text: "Address", fontSize: 8, border: [0, 0] },
            { text: `${client.address}`, fontSize: 8, border: [0, 0] },
          ],
          [
            { text: "Center No", fontSize: 8, border: [0, 0] },
            { text: `${client.center.centerNo}`, fontSize: 8, border: [0, 0] },
          ],
          [
            { text: "Account No", fontSize: 8, border: [0, 0] },
            { text: `${client.acctNumber}`, fontSize: 8, border: [0, 0] },
          ],
          [
            { text: "Cycle No", fontSize: 8, border: [0, 0] },
            { text: `${principal.cycle}`, fontSize: 8, border: [0, 0] },
          ],
          [
            { text: "Type of Loan", fontSize: 8, border: [0, 0] },
            { text: `${loanRelease?.loan?.description || ""} ${loanRelease.code}`, fontSize: 8, border: [0, 0] },
          ],
          [
            { text: "Amount Loan", fontSize: 8, border: [0, 0] },
            { text: `${formatNumber(principal?.debit || principal?.credit)}`, fontSize: 8, border: [0, 0] },
          ],
          [
            { text: "Interest Rate", fontSize: 8, border: [0, 0] },
            { text: `${loanRelease.interest}`, fontSize: 8, border: [0, 0] },
          ],
          [
            { text: "Service Charge", fontSize: 8, border: [0, 0] },
            { text: "0.00", fontSize: 8, border: [0, 0] },
          ],
          [
            { text: "Date Granted", fontSize: 8, border: [0, 0] },
            { text: `${completeNumberDate(loanRelease.date)}`, fontSize: 8, border: [0, 0] },
          ],
          [
            { text: "Maturity Date", fontSize: 8, border: [0, 0] },
            { text: `${completeNumberDate(payments[payments.length - 1].date)}`, fontSize: 8, border: [0, 0] },
          ],
        ],
      },
    },
    { text: "", margin: [4, 4] },
    {
      table: {
        widths: ["10%", "10%", "10%", "10%", "10%", "10%", "10%", "10%", "10%", "10%"],
        body: [
          [
            { text: "Collection Date", style: "headerStyle", margin: [0, 4, 0, 0], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Week No.", style: "headerStyle", margin: [0, 4, 0, 0], border: [0, 1, 0, 1], alignment: "center" },
            { text: "OR No", style: "headerStyle", margin: [0, 4, 0, 0], border: [0, 1, 0, 1], alignment: "left" },
            { text: "OR Date", style: "headerStyle", margin: [0, 4, 0, 0], border: [0, 1, 0, 1], alignment: "left" },
            { text: "Total Payment", style: "headerStyle", margin: [0, 4, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Principal Payment", style: "headerStyle", margin: [0, 4, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Outstanding Balance", style: "headerStyle", margin: [0, 0, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Interest Payment", style: "headerStyle", margin: [0, 4, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
            { text: "WSF", style: "headerStyle", margin: [0, 4, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
            { text: "Unity Fund", style: "headerStyle", margin: [0, 4, 0, 0], border: [0, 1, 0, 1], alignment: "right" },
          ],
          [
            { text: "PRINCIPAL AMOUNT", colSpan: 5, bold: true, style: "cellStyle", border: [0, 0, 0, 0], alignment: "left" },
            { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "center" },
            { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "left" },
            { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "left" },
            { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "left" },
            { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "right" },
            { text: `${formatNumber(principal?.debit || principal?.credit)}`, style: "cellStyle", border: [0, 0, 0, 0], alignment: "right" },
            { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "right" },
            { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "right" },
            { text: "", style: "cellStyle", border: [0, 0, 0, 0], alignment: "right" },
          ],
          ...rows,
        ],
      },
    },
  ];

  const styles = {
    headerStyle: { fontSize: 8, bold: true },
    cellStyle: { fontSize: 8 },
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
