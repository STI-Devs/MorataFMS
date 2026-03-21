import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { TransactionStats } from '../types';
import { trackingKeys } from '../utils/queryKeys';

export const useImportStats = (enabled = true) => {
    return useQuery<TransactionStats>({
        queryKey: trackingKeys.imports.stats,
        queryFn: () => trackingApi.getImportStats(),
        staleTime: 5 * 60 * 1000,
        enabled,
    });
};
