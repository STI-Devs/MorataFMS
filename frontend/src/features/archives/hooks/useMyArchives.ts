import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth';
import type { ArchiveYear } from '../../documents/types/document.types';
import { trackingApi } from '../../tracking/api/trackingApi';
import { archiveKeys } from '../utils/archiveQueryKeys';

export const useMyArchives = () => {
    const { user, isAuthenticated } = useAuth();

    return useQuery<ArchiveYear[]>({
        queryKey: archiveKeys.mine(user?.id ?? null),
        queryFn: trackingApi.getMyArchives,
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
};
