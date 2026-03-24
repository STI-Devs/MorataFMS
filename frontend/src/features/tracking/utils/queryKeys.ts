import type { DocumentableType } from '../types';

export const trackingKeys = {
    imports: {
        all: ['imports'] as const,
        list: (params?: unknown) => ['imports', params] as const,
        stats: ['import-stats'] as const,
    },
    exports: {
        all: ['exports'] as const,
        list: (params?: unknown) => ['exports', params] as const,
        stats: ['export-stats'] as const,
    },
    detail: (referenceId: string | undefined, scope: 'tracking' | 'record' = 'tracking') =>
        ['transaction-detail', scope, referenceId] as const,
    documents: {
        all: ['documents'] as const,
        list: (documentableType: DocumentableType | undefined, documentableId: number | undefined) =>
            ['documents', documentableType, documentableId] as const,
        transactions: (params?: unknown) => ['documents', 'transactions', params] as const,
    },
};
