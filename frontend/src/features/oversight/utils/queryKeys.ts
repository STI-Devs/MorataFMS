import type { OversightQueryParams } from '../types/transaction.types';

export const oversightKeys = {
    transactions: {
        all: ['admin', 'transactions'] as const,
        list: (params?: OversightQueryParams) => ['admin', 'transactions', params] as const,
    },
    transactionDetail: ['transaction-detail'] as const,
};

export const remarkKeys = {
    all: ['remarks'] as const,
    list: (type: 'import' | 'export', id: number | null) => ['remarks', type, id] as const,
    documents: (type: 'import' | 'export', id: number | null) => ['documents', type, id] as const,
};
