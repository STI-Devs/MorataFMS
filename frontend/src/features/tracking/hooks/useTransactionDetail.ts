import { useQuery } from '@tanstack/react-query';
import { trackingKeys } from '../utils/queryKeys';
import {
    fetchRecordTransactionDetail,
    fetchTrackingTransactionDetail,
    type TransactionDetailResult,
} from '../utils/transactionDetail';

interface UseTransactionDetailOptions {
    scope?: 'tracking' | 'record';
    enabled?: boolean;
}

/**
 * Fetches a single transaction (import or export) by its reference ID.
 * Returns both the raw API shape (needed for documentable_type) and the
 * mapped UI view-model. Result is cached for 2 minutes.
 */
export const useTransactionDetail = (
    referenceId: string | undefined,
    { scope = 'tracking', enabled = true }: UseTransactionDetailOptions = {},
) =>
    useQuery<TransactionDetailResult | null>({
        queryKey: trackingKeys.detail(referenceId, scope),
        queryFn: () => (
            scope === 'tracking'
                ? fetchTrackingTransactionDetail(referenceId!)
                : fetchRecordTransactionDetail(referenceId!)
        ),
        enabled:  enabled && !!referenceId,
        staleTime: 1000 * 60 * 2,
    });
