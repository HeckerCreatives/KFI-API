exports.formatNumber = num =>
  Number(num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

exports.convertToWords = () => {};

exports.numberToWordsWithDecimals = (num, decimalPlaces = 2) => {
  if (isNaN(num)) return "Not a number";

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * Math.pow(10, decimalPlaces));
  const isNegative = num < 0;

  let words = "";

  if (integerPart === 0 && decimalPart === 0) {
    words = "zero";
  } else {
    if (integerPart > 0) {
      words = `${this.numberToWords(integerPart)} ${decimalPart < 1 ? " peso only." : ""}`;
    }

    if (decimalPart > 0) {
      if (words) words += "peso and ";
      words += this.numberToWords(decimalPart) + " " + (decimalPart === 1 ? "centavo only." : "centavos only.");
    }
  }

  if (isNegative) {
    words = "minus " + words;
  }

  return words.toLocaleUpperCase();
};

exports.numberToWords = num => {
  if (num === 0) return "zero";

  const units = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const scales = ["", "thousand", "million", "billion", "trillion"];

  let words = "";
  let scaleIndex = 0;

  while (num > 0) {
    const chunk = num % 1000;
    if (chunk !== 0) {
      let chunkWords = "";
      const hundreds = Math.floor(chunk / 100);
      const remainder = chunk % 100;

      if (hundreds > 0) {
        chunkWords += units[hundreds] + " hundred";
        if (remainder > 0) chunkWords += " ";
      }

      if (remainder > 0) {
        if (remainder < 10) {
          chunkWords += units[remainder];
        } else if (remainder < 20) {
          chunkWords += teens[remainder - 10];
        } else {
          chunkWords += tens[Math.floor(remainder / 10)];
          if (remainder % 10 > 0) {
            chunkWords += " " + units[remainder % 10];
          }
        }
      }

      if (scaleIndex > 0) {
        chunkWords += " " + scales[scaleIndex];
      }

      words = chunkWords + (words ? " " + words : "");
    }

    num = Math.floor(num / 1000);
    scaleIndex++;
  }

  return `${words}`;
};
