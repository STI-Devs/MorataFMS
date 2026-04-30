import { useQuery } from '@tanstack/react-query';
import { legacyBatchApi } from '../api/legacyBatchApi';
import { legacyBatchQueryKeys } from '../utils/legacyBatchQueryKeys';

export const useLegacyBatches = ({
    page = 1,
    perPage = 20,
    search = '',
}: {
    page?: number;
    perPage?: number;
    search?: string;
} = {}) => {
    return useQuery({
        queryKey: legacyBatchQueryKeys.list(page, perPage, search),
        queryFn: () => legacyBatchApi.getLegacyBatches({ page, perPage, search }),
        staleTime: 1000 * 60 * 2,
    });
};
