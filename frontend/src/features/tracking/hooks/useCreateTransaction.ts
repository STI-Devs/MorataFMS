import { useCreateExport } from './useCreateExport';
import { useCreateImport } from './useCreateImport';

/**
 * Unified hook that wraps useCreateImport / useCreateExport for the generic TransactionListPage.
 *
 * TODO: Replace with a single /api/transactions endpoint (POST) when available.
 */
export function useCreateTransaction(type: 'import' | 'export') {
    const createImport = useCreateImport();
    const createExport = useCreateExport();

    return type === 'import' ? createImport : createExport;
}
