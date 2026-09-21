export const getPagination = (page = 1, limit = 10) => {
  const currentPage = Math.max(Number(page) || 1, 1);
  const currentLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);

  const offset = (currentPage - 1) * currentLimit;

  return {
    page: currentPage,
    limit: currentLimit,
    offset,
  };
};
