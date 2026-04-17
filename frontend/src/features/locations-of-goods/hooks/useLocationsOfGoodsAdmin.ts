import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { locationOfGoodsApi } from '../api/locationOfGoodsApi';
import type {
    CreateLocationOfGoodsData,
    LocationOfGoods,
    UpdateLocationOfGoodsData,
} from '../types/locationOfGoods.types';

export const useLocationsOfGoodsAdmin = () =>
    useQuery({
        queryKey: ['admin', 'locations-of-goods'],
        queryFn: () => locationOfGoodsApi.getLocationsOfGoods(),
        select: (response: { data: LocationOfGoods[] }) => response.data ?? [],
    });

export const useCreateLocationOfGoods = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateLocationOfGoodsData) => locationOfGoodsApi.createLocationOfGoods(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'locations-of-goods'] });
            queryClient.invalidateQueries({ queryKey: ['locations-of-goods'] });
        },
    });
};

export const useUpdateLocationOfGoods = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateLocationOfGoodsData }) =>
            locationOfGoodsApi.updateLocationOfGoods(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'locations-of-goods'] });
            queryClient.invalidateQueries({ queryKey: ['locations-of-goods'] });
        },
    });
};

export const useToggleLocationOfGoods = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => locationOfGoodsApi.toggleActiveLocationOfGoods(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'locations-of-goods'] });
            queryClient.invalidateQueries({ queryKey: ['locations-of-goods'] });
        },
    });
};
