import { useState } from 'react';

import { useDebounce } from '../../../hooks/useDebounce';
import type { AuditLogCategory, AuditLogFilters, AuditLogSummary } from '../types/auditLog.types';
import { useAuditActions, useAuditLogs } from './useAuditLogs';

type ActorFilter = 'human' | 'system' | 'all';

const emptySummary: AuditLogSummary = {
    total: 0,
    created: 0,
    updated: 0,
    deleted: 0,
};

export function useAuditLogsWorkspace() {
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 300);
    const [actionFilter, setActionFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<AuditLogCategory>('business');
    const [actorFilter, setActorFilter] = useState<ActorFilter>('human');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const filters: AuditLogFilters = {
        search: debouncedSearch || undefined,
        action: actionFilter || undefined,
        category: categoryFilter,
        actor: actorFilter,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
        per_page: 25,
    };
    const actionFilters: AuditLogFilters = {
        search: debouncedSearch || undefined,
        category: categoryFilter,
        actor: actorFilter,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
    };

    const { data, isLoading, isError, refetch } = useAuditLogs(filters);
    const { data: availableActions = [] } = useAuditActions(actionFilters);

    const logs = data?.data ?? [];
    const meta = data?.meta ?? { current_page: 1, last_page: 1, per_page: 25, total: 0 };
    const summary = data?.summary ?? emptySummary;

    const resetForFilterChange = () => {
        setPage(1);
        setExpandedId(null);
    };

    return {
        // raw state
        search,
        actionFilter,
        categoryFilter,
        actorFilter,
        dateFrom,
        dateTo,
        page,
        expandedId,
        // derived data
        logs,
        meta,
        summary,
        availableActions,
        isLoading,
        isError,
        refetch,
        // expansion
        toggleExpanded: (id: number) => setExpandedId((prev) => (prev === id ? null : id)),
        // filter setters with side effects
        handleSearch: (val: string) => {
            setSearch(val);
            resetForFilterChange();
        },
        handleAction: (val: string) => {
            setActionFilter(val);
            resetForFilterChange();
        },
        handleCategory: (val: AuditLogCategory) => {
            setCategoryFilter(val);
            setActionFilter('');
            resetForFilterChange();
        },
        handleActor: (val: ActorFilter) => {
            setActorFilter(val);
            setActionFilter('');
            resetForFilterChange();
        },
        handleDateFrom: (val: string) => {
            setDateFrom(val);
            setActionFilter('');
            resetForFilterChange();
        },
        handleDateTo: (val: string) => {
            setDateTo(val);
            setActionFilter('');
            resetForFilterChange();
        },
        // pagination
        goToPreviousPage: () => setPage((p) => Math.max(1, p - 1)),
        goToNextPage: () => setPage((p) => Math.min(meta.last_page, p + 1)),
    };
}
