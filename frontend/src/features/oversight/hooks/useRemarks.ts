import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { remarkApi } from '../api/remarkApi';
import type { CreateRemarkData } from '../types/remark.types';

/** Fetch remarks for a specific transaction. Only fires when enabled. */
export const useRemarks = (type: 'import' | 'export', id: number | null, enabled = false) => {
    return useQuery({
        queryKey: ['remarks', type, id],
        queryFn: () => remarkApi.getRemarks(type, id!),
        enabled: enabled && id !== null,
    });
};

/** Create a remark (admin only). */
export const useCreateRemark = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ type, id, data }: { type: 'import' | 'export'; id: number; data: CreateRemarkData }) =>
            remarkApi.createRemark(type, id, data),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: ['remarks', variables.type, variables.id] });
            // Also refresh the oversight table so badge updates
            qc.invalidateQueries({ queryKey: ['admin', 'transactions'] });
        },
    });
};

/** Resolve a remark. */
export const useResolveRemark = (type: 'import' | 'export', transactionId: number | null) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (remarkId: number) => remarkApi.resolveRemark(remarkId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['remarks', type, transactionId] });
            qc.invalidateQueries({ queryKey: ['admin', 'transactions'] });
        },
    });
};

/** Fetch documents for a specific transaction (for pinning remarks). Only fires when enabled. */
export const useDocuments = (type: 'import' | 'export', id: number | null, enabled = false) => {
    return useQuery({
        queryKey: ['documents', type, id],
        queryFn: () => remarkApi.getDocuments(type, id!),
        enabled: enabled && id !== null,
    });
};
