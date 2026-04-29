import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { ApiClient } from '../types';
import { trackingKeys } from '../utils/queryKeys';

export const useClients = (type?: 'importer' | 'exporter', enabled = true) => {
    return useQuery<ApiClient[]>({
        queryKey: trackingKeys.clients.list(type),
        queryFn: () => trackingApi.getClients(type),
        staleTime: Infinity, // Clients rarely change
        enabled,
    });
};
