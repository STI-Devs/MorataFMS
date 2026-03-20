import { useQuery } from '@tanstack/react-query';
import { trackingKeys } from '../utils/queryKeys';
import { fetchTransactionDetail, type TransactionDetailResult } from '../utils/transactionDetail';

/**
 * Fetches a single transaction (import or export) by its reference ID.
 * Returns both the raw API shape (needed for documentable_type) and the
 * mapped UI view-model. Result is cached for 2 minutes.
 */
export const useTransactionDetail = (referenceId: string | undefined) =>
    useQuery<TransactionDetailResult | null>({
        queryKey: trackingKeys.detail(referenceId),
        queryFn: () => fetchTransactionDetail(referenceId!),
        enabled:  !!referenceId,
        staleTime: 1000 * 60 * 2,
    });
