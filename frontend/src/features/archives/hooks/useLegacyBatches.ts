import { useQuery } from '@tanstack/react-query';
import { legacyBatchApi } from '../api/legacyBatchApi';
import type { LegacyBatchModule } from '../types/legacyBatch.types';
import { legacyBatchQueryKeys } from '../utils/legacyBatchQueryKeys';

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
        staleTime: 1000 * 60 * 2,
    });
};
