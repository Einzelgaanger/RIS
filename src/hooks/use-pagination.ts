import { useState, useMemo, useCallback } from "react";

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export function usePagination<T>(items: T[], pageSize = 20) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safeCurrentPage = Math.min(page, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safeCurrentPage, pageSize]);

  const goToPage = useCallback(
    (p: number) => setPage(Math.max(1, Math.min(p, totalPages))),
    [totalPages],
  );

  const nextPage = useCallback(() => goToPage(safeCurrentPage + 1), [goToPage, safeCurrentPage]);
  const prevPage = useCallback(() => goToPage(safeCurrentPage - 1), [goToPage, safeCurrentPage]);

  // Reset to page 1 when items change significantly
  const resetPage = useCallback(() => setPage(1), []);

  return {
    items: paginatedItems,
    page: safeCurrentPage,
    totalPages,
    totalItems: items.length,
    pageSize,
    hasNext: safeCurrentPage < totalPages,
    hasPrev: safeCurrentPage > 1,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
  };
}
