import { trackingApi } from '../api/trackingApi';
import type {
    ApiExportTransaction,
    ApiImportTransaction,
    ExportTransaction,
    ImportTransaction,
} from '../types';
import { mapExportTransaction, mapImportTransaction } from './mappers';

export interface TransactionDetailResult {
    raw: ApiImportTransaction | ApiExportTransaction;
    mapped: ImportTransaction | ExportTransaction;
    isImport: boolean;
}

export async function fetchTransactionDetail(referenceId: string): Promise<TransactionDetailResult | null> {
    const importsResponse = await trackingApi.getImports({ search: referenceId });

    if (importsResponse.data.length > 0) {
        const rawImport = importsResponse.data[0];

        return {
            raw: rawImport,
            mapped: mapImportTransaction(rawImport),
            isImport: true,
        };
    }

    const exportsResponse = await trackingApi.getExports({ search: referenceId });

    if (exportsResponse.data.length > 0) {
        const rawExport = exportsResponse.data[0];

        return {
            raw: rawExport,
            mapped: mapExportTransaction(rawExport),
            isImport: false,
        };
    }

    return null;
}
