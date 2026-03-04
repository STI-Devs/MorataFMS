import { useMemo, useRef } from 'react';
import type { ApiExportTransaction, ApiImportTransaction, PaginatedResponse } from '../types';
import { useExports } from './useExports';
import { useImports } from './useImports';

interface UseTransactionListParams {
    search?: string;
    status?: string;
    selective_color?: string;
    page?: number;
    per_page?: number;
}

/**
 * Unified hook that wraps useImports / useExports for the generic TransactionListPage.
 * Returns the same shape as both underlying hooks for easy interop.
 *
 * TODO: Replace with a single /api/transactions endpoint when available,
 *       so both types can be filtered/paginated server-side in one call.
 */
export function useTransactionList(
    type: 'import' | 'export',
    params?: UseTransactionListParams,
): { data: PaginatedResponse<ApiImportTransaction | ApiExportTransaction> | undefined; isLoading: boolean; isFetching: boolean } {
    const importResult = useImports(type === 'import' ? params : undefined);
    const exportResult = useExports(type === 'export' ? params : undefined);

    // Keep a stable reference so callers can memoize on `data`
    const result = type === 'import' ? importResult : exportResult;

    const stableData = useMemo(
        () => result.data as PaginatedResponse<ApiImportTransaction | ApiExportTransaction> | undefined,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [result.data],
    );

    const _ref = useRef(stableData);
    _ref.current = stableData;

    return {
        data: result.data as PaginatedResponse<ApiImportTransaction | ApiExportTransaction> | undefined,
        isLoading: result.isLoading,
        isFetching: result.isFetching ?? false,
    };
}
