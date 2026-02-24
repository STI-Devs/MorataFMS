import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { ApiClient } from '../types';

export const useClients = (type?: 'importer' | 'exporter', enabled = true) => {
    return useQuery<ApiClient[]>({
        queryKey: ['clients', type],
        queryFn: () => trackingApi.getClients(type),
        staleTime: Infinity, // Clients rarely change
        enabled,
    });
};
