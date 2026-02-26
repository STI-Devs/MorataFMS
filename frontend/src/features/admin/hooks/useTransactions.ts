import { useQuery } from '@tanstack/react-query';
import { transactionApi } from '../api/transactionApi';
import type { OversightListResponse } from '../types/transaction.types';

/**
 * Fetches all combined import + export transactions for the admin oversight view.
 */
export const useTransactions = () => {
    return useQuery<OversightListResponse>({
        queryKey: ['admin-transactions'],
        queryFn: () => transactionApi.getAllTransactions(),
    });
};
