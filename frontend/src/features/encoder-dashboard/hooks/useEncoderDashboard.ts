import { useQuery } from '@tanstack/react-query';
import { encoderDashboardApi } from '../api/encoderDashboardApi';
import type { EncoderDashboardResponse } from '../types/encoderDashboard.types';

export const encoderDashboardKeys = {
    all: ['encoder', 'dashboard'] as const,
};

export const useEncoderDashboard = () =>
    useQuery<EncoderDashboardResponse>({
        queryKey: encoderDashboardKeys.all,
        queryFn: () => encoderDashboardApi.fetchDashboard(),
    });
