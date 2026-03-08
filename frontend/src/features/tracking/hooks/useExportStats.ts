import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { TransactionStats } from '../types';

export const useExportStats = () => {
    return useQuery<TransactionStats>({
        queryKey: ['export-stats'],
        queryFn: () => trackingApi.getExportStats(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
