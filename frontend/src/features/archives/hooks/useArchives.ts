import { useQuery } from '@tanstack/react-query';
import type { ArchiveYear } from '../../documents/types/document.types';
import { trackingApi } from '../../tracking/api/trackingApi';
import { archiveKeys } from '../utils/archiveQueryKeys';

export const useArchives = () => {
    return useQuery<ArchiveYear[]>({
        queryKey: archiveKeys.all,
        queryFn: trackingApi.getArchives,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
