import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { trackingApi } from '../../tracking/api/trackingApi';
import type { DocumentTransactionListResponse } from '../../tracking/types';
import { trackingKeys } from '../../tracking/utils/queryKeys';

interface UseDocumentTransactionsParams {
    search?: string;
    type?: 'import' | 'export';
    page?: number;
    per_page?: number;
}

export const useDocumentTransactions = (params?: UseDocumentTransactionsParams) =>
    useQuery<DocumentTransactionListResponse>({
        queryKey: trackingKeys.documents.transactions(params),
        queryFn: () => trackingApi.getDocumentTransactions(params),
        placeholderData: keepPreviousData,
    });
