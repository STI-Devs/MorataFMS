import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { ApiCountry } from '../types';
import { trackingKeys } from '../utils/queryKeys';

export const useCountries = (type?: 'import_origin' | 'export_destination', enabled = true) => {
    return useQuery<ApiCountry[]>({
        queryKey: trackingKeys.countries.list(type),
        queryFn: () => trackingApi.getCountries(type),
        staleTime: Infinity, // Countries never change
        enabled,
    });
};
