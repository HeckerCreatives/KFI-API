exports.truncate = (str, limit = 20) => (str.length > limit ? str.substring(0, limit) : str);
