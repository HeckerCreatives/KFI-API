const { DateTime } = require("luxon");

exports.completeNumberDate = date => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

exports.validateDateInput = date => {
  if (!date) return "";

  const parsedDate = DateTime.fromISO(dateString);
  if (!parsedDate.isValid) return "";

  return date;
};

exports.getNextWednesdayDate = date => {
  const today = DateTime.fromISO(date);
  const thisWeekWednesday = today.set({ weekday: 3 });

  return today.weekday >= 3 ? thisWeekWednesday.plus({ weeks: 1 }).toISODate() : thisWeekWednesday.toISODate();
};

exports.getCoveredWednesdayDates = (noOfWeeks, date) => {
  const startDate = DateTime.fromISO(this.getNextWednesdayDate(date));
  const dates = [];
  for (let i = 0; i < noOfWeeks; i++) {
    dates.push(startDate.plus({ weeks: i }).toISODate());
  }
  return dates;
};

exports.setPaymentDates = (noOfWeeks, date) => {
  const startDate = DateTime.fromJSDate(new Date(date));
  const nextWednesday = DateTime.fromISO(this.getNextWednesdayDate(startDate));

  return Array.from({ length: noOfWeeks }, (_, i) => ({
    date: nextWednesday.plus({ weeks: i }).toISODate(), // Returns JavaScript Date object
    paid: false,
  }));
};
