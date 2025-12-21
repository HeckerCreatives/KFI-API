const { DateTime } = require("luxon");

exports.completeNumberDate = date => {
  if (!date) return "";
  if (typeof date === "string") date = new Date(date);

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

exports.validateDateInput = date => {
  if (!date) return "";

  const parsedDate = DateTime.fromISO(date);
  if (!parsedDate.isValid) return "";

  return date;
};

exports.getNextFridayDate = date => {
  const today = DateTime.fromISO(date);
  const thisWeekWednesday = today.set({ weekday: 5 });

  return today.weekday >= 5 ? thisWeekWednesday.plus({ weeks: 1 }).toISODate() : thisWeekWednesday.toISODate();
};

exports.getCoveredFridaysDate = (noOfWeeks, date) => {
  const startDate = DateTime.fromISO(this.getNextFridayDate(date));
  const dates = [];
  for (let i = 0; i < noOfWeeks; i++) {
    dates.push(startDate.plus({ weeks: i }).toISODate());
  }
  return dates;
};

exports.setPaymentDates = (noOfWeeks, date) => {
  const startDate = DateTime.fromJSDate(new Date(date));
  const nextFriday = DateTime.fromISO(this.getNextFridayDate(startDate));

  return Array.from({ length: noOfWeeks }, (_, i) => ({
    date: nextFriday.plus({ weeks: i }).toISODate(), // Returns JavaScript Date object
    paid: false,
    week: i + 1,
  }));
};

exports.isSameMonth = (date1, date2) => {
  if (typeof date1 === "string") date1 = new Date(date1);
  if (typeof date2 === "string") date2 = new Date(date2);
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
};

exports.isValidDate = date => {
  const dt = DateTime.fromFormat(date, "yyyy-MM-dd");
  return dt.isValid;
};

exports.getMonth = date => {
  return new Date(date).getMonth() + 1;
};

exports.getYear = date => {
  return new Date(date).getFullYear();
};
