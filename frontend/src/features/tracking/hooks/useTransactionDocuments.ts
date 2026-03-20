import { useQuery, useQueryClient } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { ApiDocument, DocumentableType } from '../types';
import { trackingKeys } from '../utils/queryKeys';

interface UseTransactionDocumentsParams {
    documentable_type: DocumentableType;
    documentable_id: number;
}

export const useTransactionDocuments = (
    params: UseTransactionDocumentsParams | null,
    stages: { type: string }[],
) => {
    const query = useQuery<ApiDocument[]>({
        queryKey: trackingKeys.documents.list(params?.documentable_type, params?.documentable_id),
        queryFn: () => trackingApi.getDocuments(params!),
        enabled: !!params,
        staleTime: 1000 * 60 * 2,
    });

    const byStageIndex: Record<number, ApiDocument> = {};
    if (query.data) {
        query.data.forEach((doc) => {
            const stageIndex = stages.findIndex((stage) => stage.type === doc.type);
            if (stageIndex !== -1 && (!byStageIndex[stageIndex] || doc.id > byStageIndex[stageIndex].id)) {
                byStageIndex[stageIndex] = doc;
            }
        });
    }

    return { ...query, byStageIndex };
};

export const useAddDocumentToCache = () => {
    const queryClient = useQueryClient();

    return (documentableType: DocumentableType, documentableId: number, doc: ApiDocument) => {
        queryClient.setQueryData<ApiDocument[]>(
            trackingKeys.documents.list(documentableType, documentableId),
            (previousDocuments = []) => {
                const filteredDocuments = previousDocuments.filter((existingDocument) => existingDocument.type !== doc.type);
                return [doc, ...filteredDocuments];
            },
        );
    };
};
