import {
    CalendarRange,
    FileEdit,
    History,
    PlusCircle,
    RotateCcw,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { Pagination } from '../../../components/Pagination';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { Input } from '../../../components/ui/input';
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../components/ui/table';
import { useAuditLogsWorkspace } from '../hooks/useAuditLogsWorkspace';
import { getEventCfg } from '../utils/auditLog.utils';
import { AuditLogTableRow } from './AuditLogTableRow';

const ACTOR_FILTER_OPTIONS: Array<{ key: 'human' | 'system' | 'all'; label: string }> = [
    { key: 'human', label: 'User Actions' },
    { key: 'system', label: 'System Events' },
    { key: 'all', label: 'All Activity' },
];

const selectCls =
    'h-8 px-2.5 rounded-lg border border-border/80 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer';

export const AuditLogs = () => {
    const {
        search,
        actionFilter,
        categoryFilter,
        actorFilter,
        dateFrom,
        dateTo,
        page,
        perPage,
        expandedId,
        logs,
        meta,
        summary,
        availableActions,
        isLoading,
        isError,
        refetch,
        toggleExpanded,
        handleSearch,
        handleAction,
        handleCategory,
        handleActor,
        handleDateFrom,
        handleDateTo,
        setPage,
        handlePerPageChange,
    } = useAuditLogsWorkspace();

    const isFiltered = Boolean(
        search.trim() ||
            actionFilter ||
            categoryFilter !== 'business' ||
            actorFilter !== 'human' ||
            dateFrom ||
            dateTo
    );

    const handleResetFilters = () => {
        handleSearch('');
        handleCategory('business');
        handleActor('human');
        handleAction('');
        handleDateFrom('');
        handleDateTo('');
    };

    return (
        <div className="w-full space-y-4 pb-6">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Audit Logs</h1>
                <p className="text-sm text-muted-foreground">
                    Record of all create, update, and delete events across the system.
                </p>
            </div>

            {/* Section 1: KPI Metric Cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. Total Events */}
                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Visible Events</CardTitle>
                        <History className="size-4 text-muted-foreground/70" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {isLoading ? '—' : summary.total.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Recorded audit trails
                        </p>
                    </CardContent>
                </Card>

                {/* 2. Created */}
                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Created</CardTitle>
                        <PlusCircle className="size-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {isLoading ? '—' : summary.created.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Entity creation records
                        </p>
                    </CardContent>
                </Card>

                {/* 3. Updated */}
                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Updated</CardTitle>
                        <FileEdit className="size-4 text-blue-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {isLoading ? '—' : summary.updated.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Modifications and changes
                        </p>
                    </CardContent>
                </Card>

                {/* 4. Deleted */}
                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Deleted</CardTitle>
                        <Trash2
                            className={`size-4 ${summary.deleted > 0 ? 'text-rose-500' : 'text-muted-foreground/70'}`}
                        />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div
                            className={`text-2xl font-bold tracking-tight tabular-nums ${
                                summary.deleted > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
                            }`}
                        >
                            {isLoading ? '—' : summary.deleted.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {summary.deleted === 0 ? 'No archived entries' : `${summary.deleted} deletion events`}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Section 2: Main Content Area */}
            <div className="flex flex-col gap-3">
                {/* Search & Filter Toolbar */}
                <div className="flex flex-col gap-3">
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                        {/* Search Input */}
                        <div className="relative w-full min-w-0 sm:w-[220px] lg:w-[260px]">
                            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by user..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="h-8 pl-8 text-xs"
                            />
                        </div>

                        {/* Actor Filter Pills */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {ACTOR_FILTER_OPTIONS.map((option) => {
                                const isSelected = actorFilter === option.key;
                                return (
                                    <Button
                                        key={option.key}
                                        variant={isSelected ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleActor(option.key)}
                                        className={`h-8 px-2.5 text-xs font-medium shrink-0 shadow-2xs transition-all cursor-pointer ${
                                            !isSelected
                                                ? 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border-border/80'
                                                : ''
                                        }`}
                                    >
                                        {option.label}
                                    </Button>
                                );
                            })}
                        </div>

                        {/* Category Select */}
                        <select
                            value={categoryFilter}
                            onChange={(e) => handleCategory(e.target.value as typeof categoryFilter)}
                            className={selectCls}
                        >
                            <option value="business">Business Audit</option>
                            <option value="operational">Operational Events</option>
                            <option value="all">All Records</option>
                        </select>

                        {/* Event Action Select */}
                        <select
                            value={actionFilter}
                            onChange={(e) => handleAction(e.target.value)}
                            className={selectCls}
                        >
                            <option value="">All Events</option>
                            {availableActions.map((event) => (
                                <option key={event} value={event}>
                                    {getEventCfg(event).label}
                                </option>
                            ))}
                        </select>

                        {/* Date Range (folded into one popover) */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2.5 text-xs gap-1.5 border-dashed font-medium shrink-0 text-muted-foreground shadow-2xs transition-all cursor-pointer"
                                >
                                    <CalendarRange className="size-3.5" />
                                    {dateFrom || dateTo ? `${dateFrom ?? '…'} → ${dateTo ?? '…'}` : 'All Dates'}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="max-w-[calc(100vw-2rem)] p-2.5 space-y-2">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[11px] text-muted-foreground">From:</span>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => handleDateFrom(e.target.value)}
                                        className={selectCls}
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[11px] text-muted-foreground">To:</span>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => handleDateTo(e.target.value)}
                                        className={selectCls}
                                    />
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Reset Button */}
                        {isFiltered ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleResetFilters}
                                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                Reset
                                <X className="ml-1 size-3.5" />
                            </Button>
                        ) : null}
                    </div>
                </div>

                {/* Table Card */}
                <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
                    {isLoading ? (
                        <div className="flex min-h-[280px] flex-col items-center justify-center p-12">
                            <div className="h-7 w-7 rounded-full border-2 border-border border-t-emerald-500 animate-spin" />
                            <p className="mt-3 text-xs font-medium text-muted-foreground">Loading audit logs...</p>
                        </div>
                    ) : isError ? (
                        <div className="p-12 text-center">
                            <p className="text-sm font-medium text-rose-500 mb-2">Failed to load audit logs.</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void refetch()}
                                className="h-7 text-xs gap-1.5 cursor-pointer"
                            >
                                <RotateCcw className="size-3" />
                                Try again
                            </Button>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex min-h-[280px] flex-col items-center justify-center p-8 text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted/30 text-muted-foreground shadow-2xs">
                                <History className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">No events found</h3>
                            <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
                                {isFiltered
                                    ? 'No audit log entries match the current filter criteria.'
                                    : 'Events will appear here as actions are performed in the system.'}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow className="hover:bg-transparent border-b border-border/80">
                                            <TableHead className="h-9 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[18%] min-w-[150px]">
                                                Timestamp
                                            </TableHead>
                                            <TableHead className="h-9 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[18%] min-w-[140px]">
                                                User
                                            </TableHead>
                                            <TableHead className="h-9 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[15%] min-w-[120px]">
                                                Event
                                            </TableHead>
                                            <TableHead className="h-9 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[20%] min-w-[160px]">
                                                Record
                                            </TableHead>
                                            <TableHead className="h-9 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[12%] min-w-[90px]">
                                                Changes
                                            </TableHead>
                                            <TableHead className="h-9 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[12%] min-w-[100px]">
                                                IP
                                            </TableHead>
                                            <TableHead className="h-9 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[5%] min-w-[40px] text-right" />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.map((log, idx) => (
                                            <AuditLogTableRow
                                                key={log.id}
                                                log={log}
                                                idx={idx}
                                                isOpen={expandedId === log.id}
                                                onToggle={() => toggleExpanded(log.id)}
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination Footer */}
                            {meta.total > 0 ? (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 border-t border-border/80 bg-muted/20">
                                    <p className="text-xs text-muted-foreground">
                                        Showing {(meta.current_page - 1) * meta.per_page + 1} to{' '}
                                        {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total} events
                                    </p>
                                    <Pagination
                                        currentPage={page}
                                        totalPages={meta.last_page}
                                        perPage={perPage}
                                        onPageChange={setPage}
                                        onPerPageChange={handlePerPageChange}
                                        perPageOptions={[15, 25, 50, 100]}
                                        compact
                                    />
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
