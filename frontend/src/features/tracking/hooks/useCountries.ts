import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { ApiCountry } from '../types';

export const useCountries = (type?: 'export_destination' | 'import_origin', enabled = true) => {
    return useQuery<ApiCountry[]>({
        queryKey: ['countries', type],
        queryFn: () => trackingApi.getCountries(type),
        staleTime: Infinity, // Countries never change
        enabled,
    });
};
