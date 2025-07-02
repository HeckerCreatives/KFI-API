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

exports.getNextWednesdayDate = () => {
  const today = DateTime.now();
  const thisWeekWednesday = today.set({ weekday: 3 });

  return today.weekday >= 3 ? thisWeekWednesday.plus({ weeks: 1 }).toISODate() : thisWeekWednesday.toISODate();
};

exports.getCoveredWednesdayDates = noOfWeeks => {
  const startDate = DateTime.fromISO(this.getNextWednesdayDate());
  const dates = [];
  for (let i = 0; i < noOfWeeks; i++) {
    dates.push(startDate.plus({ weeks: i }).toISODate());
  }
  return dates;
};
