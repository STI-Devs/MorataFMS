import { trackingApi } from '../api/trackingApi';
import { isAxiosError } from '../../../lib/apiErrors';
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

function mapImportDetail(rawImport: ApiImportTransaction): TransactionDetailResult {
    return {
        raw: rawImport,
        mapped: mapImportTransaction(rawImport),
        isImport: true,
    };
}

function mapExportDetail(rawExport: ApiExportTransaction): TransactionDetailResult {
    return {
        raw: rawExport,
        mapped: mapExportTransaction(rawExport),
        isImport: false,
    };
}

export async function fetchTrackingTransactionDetail(referenceId: string): Promise<TransactionDetailResult | null> {
    try {
        const detail = await trackingApi.getTrackingDetail(referenceId);

        if (detail.type === 'import') {
            return mapImportDetail(detail.transaction);
        }

        return mapExportDetail(detail.transaction);
    } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
            return null;
        }

        throw error;
    }
}

export async function fetchRecordTransactionDetail(referenceId: string): Promise<TransactionDetailResult | null> {
    const importsResponse = await trackingApi.getImports({ search: referenceId });
    const matchedImport = importsResponse.data.find((transaction) => transaction.customs_ref_no === referenceId);

    if (matchedImport) {
        return mapImportDetail(matchedImport);
    }

    const exportsResponse = await trackingApi.getExports({ search: referenceId });
    const exportIdMatch = referenceId.match(/^(?:EXP-)?(\d+)$/i);
    const exportId = exportIdMatch ? Number(exportIdMatch[1]) : null;
    const matchedExport = exportsResponse.data.find((transaction) =>
        exportId !== null ? transaction.id === exportId : false,
    );

    if (matchedExport) {
        return mapExportDetail(matchedExport);
    }

    return null;
}
