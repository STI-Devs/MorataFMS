export const legacyBatchQueryKeys = {
    all: ['legacy-batches'] as const,
    list: (page: number, perPage: number, search: string) => ['legacy-batches', 'list', page, perPage, search] as const,
    detail: (batchId: string) => ['legacy-batches', batchId] as const,
};
