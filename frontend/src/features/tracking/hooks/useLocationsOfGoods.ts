import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { ApiLocationOfGoods } from '../types';
import { trackingKeys } from '../utils/queryKeys';

export const useLocationsOfGoods = (enabled = true) =>
    useQuery<ApiLocationOfGoods[]>({
        queryKey: trackingKeys.locationsOfGoods,
        queryFn: () => trackingApi.getLocationsOfGoods(),
        staleTime: Infinity,
        enabled,
    });
