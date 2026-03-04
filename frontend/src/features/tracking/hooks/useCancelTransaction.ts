import { useCancelExport } from './useCancelExport';
import { useCancelImport } from './useCancelImport';

/**
 * Unified hook that wraps useCancelImport / useCancelExport for the generic TransactionListPage.
 *
 * TODO: Replace with a single /api/transactions/{id}/cancel endpoint when available.
 */
export function useCancelTransaction(type: 'import' | 'export') {
    const cancelImport = useCancelImport();
    const cancelExport = useCancelExport();

    return type === 'import' ? cancelImport : cancelExport;
}
