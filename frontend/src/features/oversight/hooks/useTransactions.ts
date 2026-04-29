import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isEncoder } from '../../auth/utils/access';
import { transactionApi } from '../api/transactionApi';
import { oversightKeys } from '../utils/queryKeys';
import type { OversightQueryParams } from '../types/transaction.types';
import { userApi } from '../../users/api/userApi';
import { userKeys } from '../../users/utils/queryKeys';
import type { User } from '../../users/types/user.types';

export const useAllTransactions = (params?: OversightQueryParams) =>
    useQuery({
        queryKey: oversightKeys.transactions.list(params),
        queryFn: () => transactionApi.getAllTransactions(params),
        placeholderData: keepPreviousData,
    });

export const useEncoders = () =>
    useQuery({
        queryKey: userKeys.encoders,
        queryFn: () => userApi.getUsers(),
        select: (response): User[] => (response.data ?? []).filter((user) => isEncoder(user)),
        placeholderData: keepPreviousData,
    });

export const useOverrideImportStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            transactionApi.overrideImportStatus(id, status),
        onSuccess: () => qc.invalidateQueries({ queryKey: oversightKeys.transactions.all }),
    });
};

export const useOverrideExportStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            transactionApi.overrideExportStatus(id, status),
        onSuccess: () => qc.invalidateQueries({ queryKey: oversightKeys.transactions.all }),
    });
};
