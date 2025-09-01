exports.hasDuplicateLines = array => {
  const ids = array.map(item => item.line);
  return ids.length !== new Set(ids).size;
};
