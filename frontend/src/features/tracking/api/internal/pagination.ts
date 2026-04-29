import type { PaginatedResponse } from '../../types';

export const MAX_PAGE_SIZE = 500;

export async function fetchAllPages<T>(
    fetchPage: (page: number) => Promise<PaginatedResponse<T>>,
): Promise<T[]> {
    const firstPage = await fetchPage(1);
    const allRows = [...firstPage.data];
    const lastPage = firstPage.meta?.last_page ?? 1;

    if (lastPage <= 1) {
        return allRows;
    }

    const remainingPages = await Promise.all(
        Array.from({ length: lastPage - 1 }, (_, index) => fetchPage(index + 2)),
    );

    for (const page of remainingPages) {
        allRows.push(...page.data);
    }

    return allRows;
}
