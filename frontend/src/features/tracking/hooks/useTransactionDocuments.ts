import { useQuery, useQueryClient } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { ApiDocument, DocumentableType } from '../types';

interface UseTransactionDocumentsParams {
    documentable_type: DocumentableType;
    documentable_id:   number;
}

/**
 * Fetches all documents for a given transaction and returns them keyed by
 * stage index, using the provided stage-to-type mapping.
 *
 * @param params  - documentable_type + documentable_id (set to null to disable)
 * @param stages  - Ordered array of stage definitions with a `type` field
 */
export const useTransactionDocuments = (
    params: UseTransactionDocumentsParams | null,
    stages: { type: string }[],
) => {
    const query = useQuery<ApiDocument[]>({
        queryKey: ['transaction-documents', params?.documentable_type, params?.documentable_id],
        queryFn:  () => trackingApi.getDocuments(params!),
        enabled:  !!params,
        staleTime: 1000 * 60 * 2,
    });

    // Map docs to stage index (most-recent doc per stage wins)
    const byStageIndex: Record<number, ApiDocument> = {};
    if (query.data) {
        query.data.forEach(doc => {
            const idx = stages.findIndex(s => s.type === doc.type);
            if (idx !== -1 && (!byStageIndex[idx] || doc.id > byStageIndex[idx].id)) {
                byStageIndex[idx] = doc;
            }
        });
    }

    return { ...query, byStageIndex };
};

/**
 * Returns a function that adds a newly uploaded document to the cache
 * without requiring a full refetch.
 */
export const useAddDocumentToCache = () => {
    const queryClient = useQueryClient();

    return (
        documentable_type: DocumentableType,
        documentable_id:   number,
        doc: ApiDocument,
    ) => {
        queryClient.setQueryData<ApiDocument[]>(
            ['transaction-documents', documentable_type, documentable_id],
            (prev = []) => {
                // Replace existing doc of the same type, or append
                const filtered = prev.filter(d => d.type !== doc.type);
                return [doc, ...filtered];
            },
        );
    };
};
