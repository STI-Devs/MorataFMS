import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '../../tracking/api/trackingApi';
import type { ApiDocument, DocumentableType } from '../../tracking/types';
import { trackingKeys } from '../../tracking/utils/queryKeys';

export const useDocuments = (
    documentableType: DocumentableType,
    documentableId: number,
    enabled = true,
) =>
    useQuery<ApiDocument[]>({
        queryKey: trackingKeys.documents.list(documentableType, documentableId),
        queryFn: () =>
            trackingApi.getDocuments({
                documentable_type: documentableType,
                documentable_id: documentableId,
            }),
        enabled: enabled && documentableId > 0,
    });
