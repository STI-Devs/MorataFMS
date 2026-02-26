import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { ArchiveYear } from '../types/document.types';

export const useArchives = () => {
    return useQuery<ArchiveYear[]>({
        queryKey: ['archives'],
        queryFn: trackingApi.getArchives,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
