import api from '../../../lib/axios';
import type { AuditLogFilters, AuditLogListResponse } from '../types/auditLog.types';

const toAuditLogParams = (filters: AuditLogFilters): Record<string, string | number> => {
    const params: Record<string, string | number> = {};
    if (filters.search) params.search = filters.search;
    if (filters.action) params.event = filters.action;
    if (filters.category) params.category = filters.category;
    if (filters.user_id) params.user_id = filters.user_id;
    if (filters.date_from) params.from = filters.date_from;
    if (filters.date_to) params.to = filters.date_to;
    if (filters.page) params.page = filters.page;
    if (filters.per_page) params.per_page = filters.per_page;
    if (filters.actor) params.actor = filters.actor;

    return params;
};

export const auditLogApi = {
    async getLogs(filters: AuditLogFilters = {}): Promise<AuditLogListResponse> {
        const response = await api.get('/api/audit-logs', { params: toAuditLogParams(filters) });
        return response.data;
    },

    async getActions(filters: AuditLogFilters = {}): Promise<{ data: string[] }> {
        const response = await api.get('/api/audit-logs/actions', { params: toAuditLogParams(filters) });
        return response.data;
    },
};
