import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useDebounce } from '../../../hooks/useDebounce';
import { trackingKeys } from '../../tracking/utils/queryKeys';
import { transactionApi } from '../api/transactionApi';
import { useAllTransactions } from './useTransactions';
import type { OversightTransaction } from '../types/transaction.types';
import { oversightKeys } from '../utils/queryKeys';
import {
    buildOversightGroups,
    type StatusFilter,
    type TypeFilter,
} from '../utils/oversightTransaction.utils';

export function useOversightWorkspace() {
    const qc = useQueryClient();

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [statusTarget, setStatusTarget] = useState<OversightTransaction | null>(null);
    const [remarkTarget, setRemarkTarget] = useState<OversightTransaction | null>(null);
    const [detailTarget, setDetailTarget] = useState<OversightTransaction | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<OversightTransaction | null>(null);
    const [deletingTargetKey, setDeletingTargetKey] = useState<string | null>(null);

    const { data, isLoading, isError, refetch } = useAllTransactions({
        page,
        per_page: perPage,
        search: debouncedSearch,
        status: statusFilter,
        type: typeFilter !== 'all' ? typeFilter : undefined,
    });

    const stats = {
        total: data?.total ?? 0,
        imports: data?.imports_count ?? 0,
        exports: data?.exports_count ?? 0,
    };

    const transactions = useMemo<OversightTransaction[]>(() => data?.data ?? [], [data?.data]);
    const meta = data?.meta;
    const visibleBlocked = transactions.filter((transaction) => transaction.open_remarks_count > 0).length;

    const groups = useMemo(() => buildOversightGroups(transactions), [transactions]);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set(groups.map((group) => group.vesselKey)));

    const seenGroupsRef = useRef<Set<string>>(new Set(groups.map((g) => g.vesselKey)));

    useEffect(() => {
        setExpandedGroups((prev) => {
            let hasNew = false;
            const next = new Set(prev);
            for (const g of groups) {
                if (!seenGroupsRef.current.has(g.vesselKey)) {
                    seenGroupsRef.current.add(g.vesselKey);
                    next.add(g.vesselKey);
                    hasNew = true;
                }
            }
            return hasNew ? next : prev;
        });
    }, [groups]);

    const toggleGroup = (key: string) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const invalidateTransactionCaches = (type?: 'import' | 'export') => {
        qc.invalidateQueries({ queryKey: oversightKeys.transactions.all });
        qc.invalidateQueries({ queryKey: oversightKeys.transactionDetail });

        if (type === 'import') {
            qc.invalidateQueries({ queryKey: trackingKeys.imports.all });
            qc.invalidateQueries({ queryKey: trackingKeys.imports.stats });
            return;
        }

        if (type === 'export') {
            qc.invalidateQueries({ queryKey: trackingKeys.exports.all });
            qc.invalidateQueries({ queryKey: trackingKeys.exports.stats });
        }
    };

    const handleStatusSuccess = (_transactionId: number, type: 'import' | 'export') => {
        invalidateTransactionCaches(type);
    };

    const handleDelete = (transaction: OversightTransaction) => {
        setDeleteTarget(transaction);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const transaction = deleteTarget;
        setDeleteTarget(null);

        const rowKey = `${transaction.type}-${transaction.id}`;
        setDeletingTargetKey(rowKey);

        try {
            if (transaction.type === 'import') {
                await transactionApi.deleteImport(transaction.id);
            } else {
                await transactionApi.deleteExport(transaction.id);
            }

            invalidateTransactionCaches(transaction.type);
        } finally {
            setDeletingTargetKey(null);
        }
    };

    const setSearchAndResetPage = (value: string) => {
        setSearchTerm(value);
        setPage(1);
    };

    const setTypeAndResetPage = (value: TypeFilter) => {
        setTypeFilter(value);
        setPage(1);
    };

    const setStatusAndResetPage = (value: StatusFilter) => {
        setStatusFilter(value);
        setPage(1);
    };

    return {
        // query state
        isLoading,
        isError,
        refetch,
        // pagination
        page,
        setPage,
        perPage,
        setPerPage,
        meta,
        // filters
        searchTerm,
        setSearchTerm: setSearchAndResetPage,
        typeFilter,
        setTypeFilter: setTypeAndResetPage,
        statusFilter,
        setStatusFilter: setStatusAndResetPage,
        // data
        transactions,
        groups,
        stats,
        visibleBlocked,
        // group expansion
        expandedGroups,
        toggleGroup,
        // modal targets
        statusTarget,
        setStatusTarget,
        remarkTarget,
        setRemarkTarget,
        detailTarget,
        setDetailTarget,
        deleteTarget,
        setDeleteTarget,
        deletingTargetKey,
        // handlers
        handleStatusSuccess,
        handleDelete,
        confirmDelete,
    };
}
