import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { countryApi } from '../api/countryApi';
import type { CreateCountryData, UpdateCountryData } from '../types/country.types';

export const useCountriesAdmin = () =>
    useQuery({
        queryKey: ['admin', 'countries'],
        queryFn: () => countryApi.getCountries(),
        select: (response) => response.data ?? [],
    });

export const useCreateCountry = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCountryData) => countryApi.createCountry(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'countries'] });
            queryClient.invalidateQueries({ queryKey: ['countries'] });
        },
    });
};

export const useUpdateCountry = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateCountryData }) => countryApi.updateCountry(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'countries'] });
            queryClient.invalidateQueries({ queryKey: ['countries'] });
        },
    });
};

export const useToggleCountry = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => countryApi.toggleActiveCountry(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'countries'] });
            queryClient.invalidateQueries({ queryKey: ['countries'] });
        },
    });
};
