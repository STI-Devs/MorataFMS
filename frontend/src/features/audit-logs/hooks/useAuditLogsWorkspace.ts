import { useState } from 'react';

import { useDebounce } from '../../../hooks/useDebounce';
import type { AuditLogFilters } from '../types/auditLog.types';
import { useAuditLogs } from './useAuditLogs';

type ActorFilter = 'human' | 'system' | 'all';

export function useAuditLogsWorkspace() {
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 300);
    const [actionFilter, setActionFilter] = useState('');
    const [actorFilter, setActorFilter] = useState<ActorFilter>('human');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const filters: AuditLogFilters = {
        search: debouncedSearch || undefined,
        action: actionFilter || undefined,
        actor: actorFilter,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
        per_page: 25,
    };

    const { data, isLoading, isError, refetch } = useAuditLogs(filters);

    const logs = data?.data ?? [];
    const meta = data?.meta ?? { current_page: 1, last_page: 1, per_page: 25, total: 0 };

    const resetForFilterChange = () => {
        setPage(1);
        setExpandedId(null);
    };

    return {
        // raw state
        search,
        actionFilter,
        actorFilter,
        dateFrom,
        dateTo,
        page,
        expandedId,
        // derived data
        logs,
        meta,
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
        handleActor: (val: ActorFilter) => {
            setActorFilter(val);
            resetForFilterChange();
        },
        handleDateFrom: (val: string) => {
            setDateFrom(val);
            resetForFilterChange();
        },
        handleDateTo: (val: string) => {
            setDateTo(val);
            resetForFilterChange();
        },
        // pagination
        goToPreviousPage: () => setPage((p) => Math.max(1, p - 1)),
        goToNextPage: () => setPage((p) => Math.min(meta.last_page, p + 1)),
    };
}
