import { useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { Icon } from '../../../components/Icon';
import { Pagination } from '../../../components/Pagination';
import { useDebounce } from '../../../hooks/useDebounce';
import { useCancelTransaction } from '../hooks/useCancelTransaction';
import { useCreateTransaction } from '../hooks/useCreateTransaction';
import { useTransactionList } from '../hooks/useTransactionList';
import { useTransactionStats } from '../hooks/useTransactionStats';
import type { ApiExportTransaction, ApiImportTransaction, CreateExportPayload, CreateImportPayload, LayoutContext } from '../types';
import { CancelTransactionModal } from './CancelTransactionModal';
import { EncodeModal } from './EncodeModal';


export interface TransactionListPageProps<T> {
    type: 'import' | 'export';
    title: string;
    subtitle: string;
    encodeButtonLabel: string;
    gridTemplateColumns: string;
    renderHeaders: () => React.ReactNode;
    renderRow: (
        row: T,
        index: number,
        navigate: ReturnType<typeof useNavigate>,
        onCancel: (id: number, ref: string) => void,
    ) => React.ReactNode;
    mapResponseData: (data: (ApiImportTransaction | ApiExportTransaction)[]) => T[];
}





export function TransactionListPage<T>({
    type,
    title,
    subtitle,
    encodeButtonLabel,
    gridTemplateColumns,
    renderHeaders,
    renderRow,
    mapResponseData,
}: TransactionListPageProps<T>) {
    const navigate = useNavigate();
    const { dateTime } = useOutletContext<LayoutContext>();

    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [filterType, setFilterType] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [openDropdown, setOpenDropdown] = useState<'filter' | 'value' | null>(null);

    const [isEncodeOpen, setIsEncodeOpen] = useState(false);
    const [cancelTarget, setCancelTarget] = useState<{ id: number; ref: string } | null>(null);

    const statsQuery = useTransactionStats(type);
    const createMutation = useCreateTransaction(type);
    const cancelMutation = useCancelTransaction(type);

    const { data: response, isLoading, isFetching } = useTransactionList(type, {
        search: debouncedSearch || undefined,
        // When user picks a status explicitly, honour it; otherwise hide finalized (in Documents)
        status: filterType === 'Status' ? filterValue : undefined,
        exclude_statuses: filterType === 'Status' ? undefined : 'completed,cancelled',
        selective_color: filterType === 'SC' ? filterValue : undefined,
        page,
        per_page: perPage,
    });

    const data = useMemo(() => mapResponseData(response?.data ?? []), [response, mapResponseData]);
    const stats = statsQuery.data;

    const setPage = (p: number) =>
        setSearchParams(prev => { prev.set('page', String(p)); return prev; });

    const setPerPage = (pp: number) =>
        setSearchParams(prev => { prev.set('per_page', String(pp)); prev.set('page', '1'); return prev; });

    const handleResetFilter = () => { setFilterType(''); setFilterValue(''); setOpenDropdown(null); };

    const total = (stats?.pending ?? 0) + (stats?.in_progress ?? 0);
    const isLoadingStats = statsQuery.isLoading || isLoading;

    const statCards = [
        { label: 'Active Shipments', value: total, dot: '#0a84ff', sub: 'Total active' },
        { label: 'Pending Action', value: stats?.pending ?? 0, dot: '#ff9f0a', sub: 'Needs attention' },
        { label: 'In Progress', value: stats?.in_progress ?? 0, dot: '#64d2ff', sub: 'Currently moving' },
        ...(type === 'import' ? [{ label: 'Overdue Shipments', value: stats?.overdue ?? 0, dot: '#ef4444', sub: 'Past target dates' }] : []),
    ];

    return (
        <div className="space-y-5 p-4">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">{title}</h1>
                    <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
                </div>
                <div className="text-right hidden sm:block shrink-0">
                    <p className="text-xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-xs text-text-muted">{dateTime.date}</p>
                </div>
            </div>

            {/* Stats */}
            <div className={`grid gap-3 ${type === 'import' ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-3'}`}>
                {statCards.map(stat => (
                    <div
                        key={stat.label}
                        className="bg-surface border border-border rounded-lg px-4 py-3.5"
                    >
                        <p className="text-[11px] font-medium text-text-muted uppercase tracking-widest mb-2">
                            {stat.label}
                        </p>
                        <div className="flex items-center gap-2">
                            {stat.dot && (
                                <span
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: stat.dot }}
                                />
                            )}
                            {isLoadingStats ? (
                                <div className="h-8 w-20 skeleton-shimmer rounded-lg" />
                            ) : (
                                <p className="text-[2rem] font-semibold tabular-nums text-text-primary leading-none">
                                    {stat.value}
                                </p>
                            )}
                        </div>
                        <p className="text-xs text-text-muted mt-2">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* List card */}
            <div className={`bg-surface rounded-xl border border-border shadow-sm transition-opacity duration-200 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>

                {/* Toolbar */}
                <div className="p-3 border-b border-border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-surface-secondary rounded-t-xl">
                    <div className="flex items-center gap-2 flex-1 flex-wrap">

                        {/* Search */}
                        <div className="relative flex-1 min-w-[180px] max-w-sm">
                            <Icon name="search" className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                            <input
                                type="text"
                                placeholder={`Search ${type}s…`}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 h-9 rounded-lg border border-border-strong bg-input-bg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 transition-colors"
                            />
                        </div>

                        {/* Filter type — import only */}
                        {type === 'import' && (
                            <div className="relative">
                                <button
                                    onClick={() => setOpenDropdown(openDropdown === 'filter' ? null : 'filter')}
                                    className="px-3 h-9 rounded-lg border border-border-strong bg-input-bg text-text-secondary text-xs font-semibold flex items-center gap-1.5 hover:text-text-primary transition-colors"
                                >
                                    {filterType || 'Filter'}
                                    <Icon name="chevron-down" className="w-3.5 h-3.5 text-text-muted" />
                                </button>
                                {openDropdown === 'filter' && (
                                    <div className="absolute top-full left-0 mt-1 w-32 bg-surface border border-border-strong rounded-xl shadow-lg z-50 overflow-hidden animate-dropdown-in">
                                        {['SC', 'Status'].map(opt => (
                                            <button
                                                key={opt}
                                                className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-hover transition-colors"
                                                onClick={() => { setFilterType(opt); setOpenDropdown(null); }}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Filter value picker */}
                        {(filterType || type === 'export') && (
                            <div className="relative">
                                <button
                                    onClick={() => setOpenDropdown(openDropdown === 'value' ? null : 'value')}
                                    className="px-3 h-9 rounded-lg border border-border-strong bg-input-bg text-text-secondary text-xs font-semibold flex items-center gap-1.5 hover:text-text-primary transition-colors"
                                >
                                    {filterValue || 'Value'}
                                    <Icon name="chevron-down" className="w-3.5 h-3.5 text-text-muted" />
                                </button>
                                {openDropdown === 'value' && (
                                    <div className="absolute top-full left-0 mt-1 w-36 bg-surface border border-border-strong rounded-xl shadow-lg z-[100] overflow-hidden animate-dropdown-in">
                                        {type === 'import' && filterType === 'SC' && (
                                            ['Green', 'Yellow', 'Orange', 'Red'].map(opt => (
                                                <button key={opt} className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-hover transition-colors" onClick={() => { setFilterValue(opt); setOpenDropdown(null); }}>
                                                    {opt}
                                                </button>
                                            ))
                                        )}
                                        {((type === 'import' && filterType === 'Status') || type === 'export') && (
                                            ['pending', 'in_progress'].map(opt => (
                                                <button key={opt} className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-hover transition-colors capitalize" onClick={() => { setFilterValue(opt); setOpenDropdown(null); }}>
                                                    {opt.replace('_', ' ')}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Clear filters */}
                        {(filterType || filterValue) && (
                            <button
                                onClick={handleResetFilter}
                                className="px-3 h-9 rounded-lg text-xs font-semibold border border-border-strong text-text-secondary hover:text-text-primary hover:bg-hover transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Encode button */}
                    <button
                        onClick={() => setIsEncodeOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-xs font-bold text-white shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition-opacity shrink-0"
                    >
                        <Icon name="plus" className="w-3.5 h-3.5" />
                        {encodeButtonLabel}
                    </button>
                </div>

                {/* Table */}
                <div className="p-4">
                    {/* Header row */}
                    <div
                        className="grid gap-4 pb-3 border-b border-border mb-2 px-4 font-bold"
                        style={{ gridTemplateColumns }}
                    >
                        {renderHeaders()}
                    </div>

                    {/* Data rows */}
                    <div>
                        {isLoading ? (
                            <div className="divide-y divide-border/50">
                                {Array.from({ length: 6 }).map((_, i) => {
                                    // Realistic varied widths per column - mirrors actual data
                                    const widths = ['30px', '90px', '80px', '70px', '120px', '80px', '30px'];
                                    return (
                                        <div key={i} className="grid gap-4 py-3.5 px-4 items-center" style={{ gridTemplateColumns }}>
                                            {gridTemplateColumns.split(' ').map((_, colIdx) => (
                                                <div
                                                    key={colIdx}
                                                    className="skeleton-shimmer rounded-md"
                                                    style={{
                                                        height: colIdx === 0 ? '10px' : '13px',
                                                        width: widths[colIdx] ?? '70px',
                                                        maxWidth: '100%',
                                                        borderRadius: colIdx === 3 ? '999px' : '6px', // pill for status column
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : data.length === 0 ? (
                            <div className="py-16 flex flex-col items-center gap-3 text-text-muted">
                                <Icon name="file-text" className="w-10 h-10 opacity-30" />
                                <p className="text-sm font-semibold">No {type} transactions found</p>
                            </div>
                        ) : (
                            data.map((row, i) => (
                                <div
                                    key={i}
                                    className={`grid gap-4 py-3 items-center cursor-pointer transition-all px-4 hover:bg-hover border-b border-border/50 ${i % 2 !== 0 ? 'bg-surface-secondary/40' : ''}`}
                                    style={{ gridTemplateColumns }}
                                    onClick={() => navigate(`/tracking/${(row as { ref?: string }).ref ?? ''}`)}
                                >
                                    {renderRow(row, i, navigate, (id, ref) => setCancelTarget({ id, ref }))}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    <Pagination
                        currentPage={response?.meta?.current_page ?? 1}
                        totalPages={response?.meta?.last_page ?? 1}
                        perPage={perPage}
                        onPageChange={setPage}
                        onPerPageChange={setPerPage}
                    />
                </div>
            </div>

            {/* Encode modal */}
            <EncodeModal
                isOpen={isEncodeOpen}
                onClose={() => setIsEncodeOpen(false)}
                type={type}
                onSave={async d => {
                    await createMutation.mutateAsync(
                        type === 'import'
                            ? (d as CreateImportPayload)
                            : (d as CreateExportPayload),
                    );
                }}
            />

            {/* Cancel modal */}
            <CancelTransactionModal
                isOpen={!!cancelTarget}
                onClose={() => setCancelTarget(null)}
                transactionRef={cancelTarget?.ref ?? ''}
                isLoading={cancelMutation.isPending}
                onConfirm={reason => {
                    if (cancelTarget) {
                        cancelMutation.mutate(
                            { id: cancelTarget.id, reason },
                            { onSuccess: () => setCancelTarget(null) },
                        );
                    }
                }}
            />
        </div>
    );
}
