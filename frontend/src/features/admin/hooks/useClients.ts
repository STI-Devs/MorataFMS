import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientApi } from '../api/clientApi';
import type { CreateClientData, UpdateClientData } from '../types/client.types';

export const useClients = () =>
    useQuery({
        queryKey: ['admin', 'clients'],
        queryFn: () => clientApi.getClients(),
        select: (res) => res.data ?? [],
    });

export const useClientTransactions = (id: number | null) =>
    useQuery({
        queryKey: ['admin', 'client-transactions', id],
        queryFn: () => clientApi.getClientTransactions(id!),
        enabled: id !== null,
    });

export const useCreateClient = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateClientData) => clientApi.createClient(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'clients'] }),
    });
};

export const useUpdateClient = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateClientData }) => clientApi.updateClient(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'clients'] }),
    });
};

export const useToggleClient = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => clientApi.toggleActiveClient(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'clients'] }),
    });
};
