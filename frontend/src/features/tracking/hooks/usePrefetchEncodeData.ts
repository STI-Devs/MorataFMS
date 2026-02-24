import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { trackingApi } from '../api/trackingApi';

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
            queryKey: ['clients', clientType],
            queryFn: () => trackingApi.getClients(clientType),
            staleTime: Infinity,
        });

        if (type === 'export') {
            queryClient.prefetchQuery({
                queryKey: ['countries', 'export_destination'],
                queryFn: () => trackingApi.getCountries('export_destination'),
                staleTime: Infinity,
            });
        }
    }, [queryClient, type]);
};
