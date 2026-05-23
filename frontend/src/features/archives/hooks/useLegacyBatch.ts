import { useQuery } from '@tanstack/react-query';
import { legacyBatchApi } from '../api/legacyBatchApi';
import { legacyBatchQueryKeys } from '../utils/legacyBatchQueryKeys';

const isActiveZipExport = (status?: string): boolean => status === 'pending' || status === 'processing';

export const useLegacyBatch = (batchId?: string | null, enabled = true) => {
    return useQuery({
        queryKey: batchId ? legacyBatchQueryKeys.detail(batchId) : [...legacyBatchQueryKeys.all, 'missing-id'],
        queryFn: () => legacyBatchApi.getLegacyBatch(batchId!),
        enabled: Boolean(batchId) && enabled,
        refetchInterval: (query) => (
            isActiveZipExport(query.state.data?.zipExport?.status) ? 3000 : false
        ),
        staleTime: 1000 * 60,
    });
};
