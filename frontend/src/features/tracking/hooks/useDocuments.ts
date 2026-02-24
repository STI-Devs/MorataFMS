import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { ApiDocument, DocumentableType } from '../types';

export const useDocuments = (
    documentableType: DocumentableType,
    documentableId: number,
    enabled = true,
) =>
    useQuery<ApiDocument[]>({
        queryKey: ['documents', documentableType, documentableId],
        queryFn: () =>
            trackingApi.getDocuments({
                documentable_type: documentableType,
                documentable_id: documentableId,
            }),
        enabled: enabled && documentableId > 0,
    });
