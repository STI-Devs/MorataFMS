import { useQuery } from '@tanstack/react-query';
import { adminDashboardApi } from '../api/adminDashboardApi';
import type { AdminDashboardResponse } from '../types/adminDashboard.types';

export const adminDashboardKeys = {
    all: ['admin', 'dashboard'] as const,
};

export const useAdminDashboard = () =>
    useQuery<AdminDashboardResponse>({
        queryKey: adminDashboardKeys.all,
        queryFn: () => adminDashboardApi.fetchDashboard(),
    });
