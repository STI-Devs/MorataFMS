import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { TransactionStats } from '../types';

/**
 * Consolidated stats hook for both import and export transactions.
 * Replaces the identical `useImportStats` and `useExportStats` pair.
 */
export const useTransactionStats = (type: 'import' | 'export') => {
    return useQuery<TransactionStats>({
        queryKey: [type === 'import' ? 'import-stats' : 'export-stats'],
        queryFn: () =>
            type === 'import'
                ? trackingApi.getImportStats()
                : trackingApi.getExportStats(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
