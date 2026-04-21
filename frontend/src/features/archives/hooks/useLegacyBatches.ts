import { useQuery } from '@tanstack/react-query';
import { legacyBatchApi } from '../api/legacyBatchApi';
import { legacyBatchQueryKeys } from '../utils/legacyBatchQueryKeys';

export const useLegacyBatches = ({
    page = 1,
    perPage = 20,
}: {
    page?: number;
    perPage?: number;
} = {}) => {
    return useQuery({
        queryKey: legacyBatchQueryKeys.list(page, perPage),
        queryFn: () => legacyBatchApi.getLegacyBatches({ page, perPage }),
        staleTime: 1000 * 60 * 2,
    });
};
