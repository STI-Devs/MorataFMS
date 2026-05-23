import type { LegacyBatchModule } from '../types/legacyBatch.types';

export const legacyBatchQueryKeys = {
    all: ['legacy-batches'] as const,
    list: (page: number, perPage: number, search: string, module?: LegacyBatchModule) =>
        ['legacy-batches', 'list', module ?? 'all', page, perPage, search] as const,
    detail: (batchId: string) => ['legacy-batches', batchId] as const,
    zipExports: (module?: LegacyBatchModule) => ['legacy-batches', 'zip-exports', module ?? 'all'] as const,
};
