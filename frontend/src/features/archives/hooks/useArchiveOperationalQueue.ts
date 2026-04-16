import { useQuery } from '@tanstack/react-query';
import { archiveTaskApi } from '../api/archiveTaskApi';
import type { ArchiveTaskRole } from '../types/archiveTask.types';
import { archiveTaskKeys } from '../utils/archiveTaskQueryKeys';

export const useArchiveOperationalQueue = (role: ArchiveTaskRole) => {
    return useQuery({
        queryKey: archiveTaskKeys.operational(role),
        queryFn: archiveTaskApi.getOperationalQueue,
        staleTime: 1000 * 60 * 2,
    });
};
