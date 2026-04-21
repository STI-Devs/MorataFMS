import { useQuery } from '@tanstack/react-query';
import { legacyBatchApi } from '../api/legacyBatchApi';
import { legacyBatchQueryKeys } from '../utils/legacyBatchQueryKeys';

export const useLegacyBatch = (batchId?: string | null, enabled = true) => {
    return useQuery({
        queryKey: batchId ? legacyBatchQueryKeys.detail(batchId) : [...legacyBatchQueryKeys.all, 'missing-id'],
        queryFn: () => legacyBatchApi.getLegacyBatch(batchId!),
        enabled: Boolean(batchId) && enabled,
        staleTime: 1000 * 60,
    });
};
