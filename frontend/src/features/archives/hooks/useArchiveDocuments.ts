import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '../../tracking/api/trackingApi';
import type {
    ArchiveDocumentIndexCompletion,
    ArchiveDocumentIndexParams,
    ArchiveDocumentIndexResponse,
} from '../types/archiveHistory.types';
import { archiveKeys } from '../utils/archiveQueryKeys';

type UseArchiveDocumentsArgs = {
    mine: boolean;
    page: number;
    perPage: number;
    search: string;
    year: string;
    type: ArchiveDocumentIndexParams['type'];
    completion: ArchiveDocumentIndexCompletion;
    enabled: boolean;
};

export const useArchiveDocuments = ({
    mine,
    page,
    perPage,
    search,
    year,
    type,
    completion,
    enabled,
}: UseArchiveDocumentsArgs) =>
    useQuery<ArchiveDocumentIndexResponse>({
        queryKey: archiveKeys.documents(mine, page, perPage, search, year, type ?? 'all', completion),
        queryFn: () => trackingApi.getArchiveDocuments({
            mine,
            page,
            per_page: perPage,
            search: search || undefined,
            year: year === 'all' ? undefined : Number(year),
            type,
            completion,
        }),
        enabled,
        staleTime: 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
