import { useQuery } from '@tanstack/react-query';
import { legacyBatchApi } from '../api/legacyBatchApi';
import type { LegacyBatchModule } from '../types/legacyBatch.types';
import { legacyBatchQueryKeys } from '../utils/legacyBatchQueryKeys';

const isActiveZipExport = (status?: string): boolean => status === 'pending' || status === 'processing';

export const useLegacyBatches = ({
    page = 1,
    perPage = 25,
    search = '',
    module,
}: {
    page?: number;
    perPage?: number;
    search?: string;
    module?: LegacyBatchModule;
} = {}) => {
    return useQuery({
        queryKey: legacyBatchQueryKeys.list(page, perPage, search, module),
        queryFn: () => legacyBatchApi.getLegacyBatches({ page, perPage, search, module }),
        refetchInterval: (query) => (
            query.state.data?.items.some((batch) => isActiveZipExport(batch.zipExport?.status))
                ? 3000
                : false
        ),
        staleTime: 1000 * 60 * 2,
    });
};
