import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth';
import type { ArchiveYear } from '../../documents/types/document.types';
import { trackingApi } from '../../tracking/api/trackingApi';

export const useMyArchives = () => {
    const { user, isAuthenticated } = useAuth();

    return useQuery<ArchiveYear[]>({
        queryKey: ['my-archives', user?.id ?? null],
        queryFn: trackingApi.getMyArchives,
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
};
