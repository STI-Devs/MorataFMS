import api from '../../../lib/axios';
import type { AuditLogListResponse, AuditLogFilters } from '../types/auditLog.types';

export const auditLogApi = {
    async getLogs(filters: AuditLogFilters = {}): Promise<AuditLogListResponse> {
        const params: Record<string, string | number> = {};
        if (filters.search) params.search = filters.search;
        if (filters.action) params.action = filters.action;
        if (filters.user_id) params.user_id = filters.user_id;
        if (filters.date_from) params.date_from = filters.date_from;
        if (filters.date_to) params.date_to = filters.date_to;
        if (filters.page) params.page = filters.page;
        if (filters.per_page) params.per_page = filters.per_page;

        const response = await api.get('/api/audit-logs', { params });
        return response.data;
    },

    async getActions(): Promise<{ data: string[] }> {
        const response = await api.get('/api/audit-logs/actions');
        return response.data;
    },
};
