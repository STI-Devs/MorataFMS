import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { TransactionStats } from '../types';
import { trackingKeys } from '../utils/queryKeys';

export const useExportStats = () => {
    return useQuery<TransactionStats>({
        queryKey: trackingKeys.exports.stats,
        queryFn: () => trackingApi.getExportStats(),
        staleTime: 5 * 60 * 1000,
    });
};
