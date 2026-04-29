import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { trackingApi } from '../api/trackingApi';
import { trackingKeys } from '../utils/queryKeys';

/**
 * Warms the TanStack Query cache with data needed by EncodeModal dropdowns.
 * Call this in any parent component that renders an EncodeModal so the
 * dropdowns populate instantly on first open.
 */
export const usePrefetchEncodeData = (type: 'import' | 'export') => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const clientType = type === 'import' ? 'importer' : 'exporter';

        queryClient.prefetchQuery({
            queryKey: trackingKeys.clients.list(clientType),
            queryFn: () => trackingApi.getClients(clientType),
            staleTime: Infinity,
        });

        if (type === 'export') {
            queryClient.prefetchQuery({
                queryKey: trackingKeys.countries.list('export_destination'),
                queryFn: () => trackingApi.getCountries('export_destination'),
                staleTime: Infinity,
            });
        } else {
            queryClient.prefetchQuery({
                queryKey: trackingKeys.locationsOfGoods,
                queryFn: () => trackingApi.getLocationsOfGoods(),
                staleTime: Infinity,
            });
        }
    }, [queryClient, type]);
};
