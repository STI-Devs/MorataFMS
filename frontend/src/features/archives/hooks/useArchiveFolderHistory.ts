import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '../../tracking/api/trackingApi';
import type {
    ArchiveFolderHistoryCompletion,
    ArchiveFolderHistoryParams,
    ArchiveFolderHistoryResponse,
} from '../types/archiveHistory.types';
import { archiveKeys } from '../utils/archiveQueryKeys';

type UseArchiveFolderHistoryArgs = {
    year: number;
    month: number;
    type: ArchiveFolderHistoryParams['type'];
    mine: boolean;
    page: number;
    perPage: number;
    search: string;
    completion: ArchiveFolderHistoryCompletion;
    sort: NonNullable<ArchiveFolderHistoryParams['sort']>;
    direction: NonNullable<ArchiveFolderHistoryParams['direction']>;
    enabled: boolean;
};

export const useArchiveFolderHistory = ({
    year,
    month,
    type,
    mine,
    page,
    perPage,
    search,
    completion,
    sort,
    direction,
    enabled,
}: UseArchiveFolderHistoryArgs) =>
    useQuery<ArchiveFolderHistoryResponse>({
        queryKey: archiveKeys.folderHistory(year, month, type, mine, page, perPage, search, completion, sort, direction),
        queryFn: () => trackingApi.getArchiveFolderHistory({
            year,
            month,
            type,
            mine,
            page,
            per_page: perPage,
            search: search || undefined,
            completion,
            sort,
            direction,
        }),
        enabled,
        staleTime: 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
