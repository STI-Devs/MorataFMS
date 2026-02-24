import api from '../../../lib/axios';
import type { OversightListResponse, EncoderUser } from '../types/transaction.types';

export const transactionApi = {
    // Get all transactions combined
    async getAllTransactions(): Promise<OversightListResponse> {
        const response = await api.get('/api/transactions');
        return response.data;
    },

    // Get list of encoders for reassignment dropdown
    async getEncoders(): Promise<{ data: EncoderUser[] }> {
        const response = await api.get('/api/transactions/encoders');
        return response.data;
    },

    // Reassign encoder for an import
    async reassignImport(id: number, assignedUserId: number): Promise<{ message: string; assigned_to: string; assigned_user_id: number }> {
        const response = await api.patch(`/api/transactions/imports/${id}/assign`, {
            assigned_user_id: assignedUserId,
        });
        return response.data;
    },

    // Reassign encoder for an export
    async reassignExport(id: number, assignedUserId: number): Promise<{ message: string; assigned_to: string; assigned_user_id: number }> {
        const response = await api.patch(`/api/transactions/exports/${id}/assign`, {
            assigned_user_id: assignedUserId,
        });
        return response.data;
    },

    // Override status for an import
    async overrideImportStatus(id: number, status: string): Promise<{ message: string; status: string }> {
        const response = await api.patch(`/api/transactions/imports/${id}/status`, { status });
        return response.data;
    },

    // Override status for an export
    async overrideExportStatus(id: number, status: string): Promise<{ message: string; status: string }> {
        const response = await api.patch(`/api/transactions/exports/${id}/status`, { status });
        return response.data;
    },
};
