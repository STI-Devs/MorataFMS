import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionApi } from '../api/transactionApi';

export const useAllTransactions = () =>
    useQuery({
        queryKey: ['admin', 'transactions'],
        queryFn: () => transactionApi.getAllTransactions(),
    });

export const useEncoders = () =>
    useQuery({
        queryKey: ['admin', 'encoders'],
        queryFn: () => transactionApi.getEncoders(),
        select: (res) => res.data ?? [],
        staleTime: Infinity,
    });

export const useReassignImport = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, userId }: { id: number; userId: number }) =>
            transactionApi.reassignImport(id, userId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'transactions'] }),
    });
};

export const useReassignExport = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, userId }: { id: number; userId: number }) =>
            transactionApi.reassignExport(id, userId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'transactions'] }),
    });
};

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
