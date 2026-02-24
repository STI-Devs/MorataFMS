import api from '../../../lib/axios';
import type { MonthlyReportResponse, ClientReportResponse, TurnaroundReportResponse } from '../types/report.types';

export const reportApi = {
    async getMonthly(year: number): Promise<MonthlyReportResponse> {
        const response = await api.get('/api/reports/monthly', { params: { year } });
        return response.data;
    },

    async getClients(year: number, month?: number): Promise<ClientReportResponse> {
        const response = await api.get('/api/reports/clients', {
            params: { year, ...(month ? { month } : {}) },
        });
        return response.data;
    },

    async getTurnaround(year: number, month?: number): Promise<TurnaroundReportResponse> {
        const response = await api.get('/api/reports/turnaround', {
            params: { year, ...(month ? { month } : {}) },
        });
        return response.data;
    },
};
