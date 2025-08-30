exports.getDistinct = (array, key) => {
  if (key) {
    return array.filter((item, index, self) => index === self.findIndex(i => i[key] === item[key]));
  }
  return [...new Set(array)];
};
