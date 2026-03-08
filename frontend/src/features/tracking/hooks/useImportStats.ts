import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { TransactionStats } from '../types';

export const useImportStats = () => {
    return useQuery<TransactionStats>({
        queryKey: ['import-stats'],
        queryFn: () => trackingApi.getImportStats(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
