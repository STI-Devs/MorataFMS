import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionApi } from '../api/transactionApi';
import type { OversightQueryParams } from '../types/transaction.types';
import { userApi } from '../../users/api/userApi';
import type { User } from '../../users/types/user.types';

export const useAllTransactions = (params?: OversightQueryParams) =>
    useQuery({
        queryKey: ['admin', 'transactions', params],
        queryFn: () => transactionApi.getAllTransactions(params),
        placeholderData: keepPreviousData,
    });

export const useEncoders = () =>
    useQuery({
        queryKey: ['admin', 'users', 'encoders'],
        queryFn: () => userApi.getUsers(),
        select: (response): User[] => (response.data ?? []).filter((user) => user.role === 'encoder'),
        placeholderData: keepPreviousData,
    });

export const useOverrideImportStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            transactionApi.overrideImportStatus(id, status),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'transactions'] }),
    });
};

export const useOverrideExportStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            transactionApi.overrideExportStatus(id, status),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'transactions'] }),
    });
};
