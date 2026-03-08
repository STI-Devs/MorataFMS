import { useQuery } from '@tanstack/react-query';
import type { ArchiveYear } from '../../documents/types/document.types';
import { trackingApi } from '../../tracking/api/trackingApi';

export const useArchives = () => {
    return useQuery<ArchiveYear[]>({
        queryKey: ['archives'],
        queryFn: trackingApi.getArchives,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
