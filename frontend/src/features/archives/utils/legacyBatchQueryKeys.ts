export const legacyBatchQueryKeys = {
    all: ['legacy-batches'] as const,
    list: (page: number, perPage: number) => ['legacy-batches', 'list', page, perPage] as const,
    detail: (batchId: string) => ['legacy-batches', batchId] as const,
};
