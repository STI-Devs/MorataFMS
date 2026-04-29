export const archiveKeys = {
    all: ['archives'] as const,
    mineAll: ['my-archives'] as const,
    mine: (userId: number | null) => ['my-archives', userId] as const,
};
