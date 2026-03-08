import type { TransactionStats } from '../types';
import { useExportStats } from './useExportStats';
import { useImportStats } from './useImportStats';

/**
 * Unified hook that wraps useImportStats / useExportStats for the generic TransactionListPage.
 *
 * TODO: Replace with a single /api/transactions/stats?type=import|export when available.
 */
export function useTransactionStats(type: 'import' | 'export'): { data: TransactionStats | undefined; isLoading: boolean } {
    const importStats = useImportStats();
    const exportStats = useExportStats();

    const result = type === 'import' ? importStats : exportStats;
    return { data: result.data, isLoading: result.isLoading };
}
