import api from '../../../lib/axios';
import type { AdminDashboardResponse } from '../types/adminDashboard.types';

export const adminDashboardApi = {
    async fetchDashboard(): Promise<AdminDashboardResponse> {
        const response = await api.get('/api/admin/dashboard');
        return response.data;
    },
};
