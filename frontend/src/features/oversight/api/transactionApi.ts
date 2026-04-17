import api from '../../../lib/axios';
import type { OversightListResponse, OversightQueryParams } from '../types/transaction.types';

export const transactionApi = {
    // Get all transactions combined (admin)
    async getAllTransactions(params?: OversightQueryParams): Promise<OversightListResponse> {
        const response = await api.get('/api/transactions', { params });
        return response.data;
    },

    // Override status for an import
    async overrideImportStatus(id: number, status: string): Promise<{ message: string; status: string }> {
        const response = await api.patch(`/api/transactions/import/${id}/status`, { status });
        return response.data;
    },

    // Override status for an export
    async overrideExportStatus(id: number, status: string): Promise<{ message: string; status: string }> {
        const response = await api.patch(`/api/transactions/export/${id}/status`, { status });
        return response.data;
    },

    // Delete a cancelled import transaction
    async deleteImport(id: number): Promise<void> {
        await api.delete(`/api/import-transactions/${id}`);
    },

    // Delete a cancelled export transaction
    async deleteExport(id: number): Promise<void> {
        await api.delete(`/api/export-transactions/${id}`);
    },
};


