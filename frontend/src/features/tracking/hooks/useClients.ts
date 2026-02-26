import { useQuery } from '@tanstack/react-query';
import { clientApi } from '../../admin/api/clientApi';
import type { ApiClient } from '../types';

export const useClients = (type?: 'importer' | 'exporter') => {
    return useQuery<ApiClient[]>({
        queryKey: ['clients', type],
        queryFn: async () => {
            const response = await clientApi.getClients(type);
            // clientApi returns { data: Client[] }; map to the ApiClient shape used by tracking
            return response.data.map(c => ({ id: c.id, name: c.name, type: c.type }));
        },
        staleTime: Infinity, // Clients rarely change
    });
};
