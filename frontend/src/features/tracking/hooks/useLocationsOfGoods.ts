import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { ApiLocationOfGoods } from '../types';

export const useLocationsOfGoods = (enabled = true) =>
    useQuery<ApiLocationOfGoods[]>({
        queryKey: ['locations-of-goods'],
        queryFn: () => trackingApi.getLocationsOfGoods(),
        staleTime: Infinity,
        enabled,
    });
