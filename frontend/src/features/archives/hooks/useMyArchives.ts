import { useQuery } from '@tanstack/react-query';
import type { ArchiveYear } from '../../documents/types/document.types';
import { trackingApi } from '../../tracking/api/trackingApi';

export const useMyArchives = () => {
    return useQuery<ArchiveYear[]>({
        queryKey: ['my-archives'],
        queryFn: trackingApi.getMyArchives,
        staleTime: 5 * 60 * 1000,
    });
};
