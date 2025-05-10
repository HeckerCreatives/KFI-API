exports.validatePaginationParams = (limit, page) => {
  const lim = parseInt(limit, 10) || 10;
  const validatedLimit = lim > 50 ? 25 : lim;
  const validatedPage = parseInt(page, 10) || 1;
  const validatedOffset = (validatedPage - 1) * validatedLimit;

  return {
    validatedLimit,
    validatedPage,
    validatedOffset,
  };
};
