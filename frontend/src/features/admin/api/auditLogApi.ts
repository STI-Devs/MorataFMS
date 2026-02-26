import api from '../../../lib/axios';
import type { AuditLogListResponse, AuditLogFilters } from '../types/auditLog.types';

export const auditLogApi = {
    async getLogs(filters: AuditLogFilters = {}): Promise<AuditLogListResponse> {
        const response = await api.get('/api/audit-logs', { params: filters });
        return response.data;
    },

    async getActions(): Promise<{ data: string[] }> {
        const response = await api.get('/api/audit-logs/actions');
        return response.data;
    },
};
