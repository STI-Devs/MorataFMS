export const archiveKeys = {
    all: ['archives'] as const,
    mineAll: ['my-archives'] as const,
    mine: (userId: number | null) => ['my-archives', userId] as const,
    folderHistory: (
        year: number,
        month: number,
        type: string,
        mine: boolean,
        page: number,
        perPage: number,
        search: string,
        completion: string,
    ) => ['archives', 'folder-history', year, month, type, mine, page, perPage, search, completion] as const,
    zipExports: (mine: boolean) => ['archives', 'zip-exports', mine] as const,
};
