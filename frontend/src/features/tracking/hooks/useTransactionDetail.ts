import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type {
    ApiExportTransaction,
    ApiImportTransaction,
    ExportTransaction,
    ImportTransaction,
} from '../types';
import { mapExportTransaction, mapImportTransaction } from '../utils/mappers';

export interface TransactionDetailResult {
    raw:     ApiImportTransaction | ApiExportTransaction;
    mapped:  ImportTransaction | ExportTransaction;
    isImport: boolean;
}

async function fetchTransactionByRef(referenceId: string): Promise<TransactionDetailResult | null> {
    const importsRes = await trackingApi.getImports({ search: referenceId });
    if (importsRes.data.length > 0) {
        const raw = importsRes.data[0];
        return { raw, mapped: mapImportTransaction(raw), isImport: true };
    }

    const exportsRes = await trackingApi.getExports({ search: referenceId });
    if (exportsRes.data.length > 0) {
        const raw = exportsRes.data[0];
        return { raw, mapped: mapExportTransaction(raw), isImport: false };
    }

    return null;
}

/**
 * Fetches a single transaction (import or export) by its reference ID.
 * Returns both the raw API shape (needed for documentable_type) and the
 * mapped UI view-model. Result is cached for 2 minutes.
 */
export const useTransactionDetail = (referenceId: string | undefined) =>
    useQuery<TransactionDetailResult | null>({
        queryKey: ['transaction-detail', referenceId],
        queryFn:  () => fetchTransactionByRef(referenceId!),
        enabled:  !!referenceId,
        staleTime: 1000 * 60 * 2,
    });
