import { useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { Icon } from '../../../components/Icon';
import { Pagination } from '../../../components/Pagination';
import { useDebounce } from '../../../hooks/useDebounce';
import { useCancelTransaction } from '../hooks/useCancelTransaction';
import { useCreateTransaction } from '../hooks/useCreateTransaction';
import { useTransactionList } from '../hooks/useTransactionList';
import { useTransactionStats } from '../hooks/useTransactionStats';
import type { CreateExportPayload, CreateImportPayload, LayoutContext } from '../types';
import { CancelTransactionModal } from './CancelTransactionModal';
import { EncodeModal } from './EncodeModal';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TransactionListPageProps<T> {
    type:                 'import' | 'export';
    title:                string;
    subtitle:             string;
    encodeButtonLabel:    string;
    gridTemplateColumns:  string;
    renderHeaders:        () => React.ReactNode;
    renderRow: (
        row:      T,
        index:    number,
        navigate: ReturnType<typeof useNavigate>,
        onCancel: (id: number, ref: string) => void,
    ) => React.ReactNode;
    mapResponseData: (data: unknown[]) => T[];
}

// ─── Stat icon helper ─────────────────────────────────────────────────────────

function StatIcon({ d, color }: { d: string; color: string }) {
    return (
        <svg className="w-4 h-4" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d={d} />
        </svg>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

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

    // ── URL-synced pagination ────────────────────────────────────────────────
    const [searchParams, setSearchParams] = useSearchParams();
    const page    = parseInt(searchParams.get('page')     || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');

    // ── Filter/search state ──────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch               = useDebounce(searchQuery, 500);
    const [filterType,  setFilterType]  = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [openDropdown, setOpenDropdown] = useState<'filter' | 'value' | null>(null);

    // ── Modal state ──────────────────────────────────────────────────────────
    const [isEncodeOpen,  setIsEncodeOpen]  = useState(false);
    const [cancelTarget,  setCancelTarget]  = useState<{ id: number; ref: string } | null>(null);

    // ── Data hooks ───────────────────────────────────────────────────────────
    const statsQuery    = useTransactionStats(type);
    const createMutation = useCreateTransaction(type);
    const cancelMutation = useCancelTransaction(type);

    const { data: response, isLoading, isFetching } = useTransactionList(type, {
        search:           debouncedSearch || undefined,
        status:           filterType === 'Status' ? filterValue : undefined,
        selective_color:  filterType === 'SC'     ? filterValue : undefined,
        page,
        per_page:         perPage,
    });

    const data  = useMemo(() => mapResponseData(response?.data ?? []), [response, mapResponseData]);
    const stats = statsQuery.data;

    // ── Handlers ─────────────────────────────────────────────────────────────
    const setPage = (p: number) =>
        setSearchParams(prev => { prev.set('page', String(p)); return prev; });

    const setPerPage = (pp: number) =>
        setSearchParams(prev => { prev.set('per_page', String(pp)); prev.set('page', '1'); return prev; });

    const handleResetFilter = () => { setFilterType(''); setFilterValue(''); setOpenDropdown(null); };

    // ── Stats cards config ───────────────────────────────────────────────────
    const total = (stats?.completed ?? 0) + (stats?.pending ?? 0) + (stats?.in_progress ?? 0) + (stats?.cancelled ?? 0);
    const statCards = [
        { label: 'Total',                                          value: total,                 color: '#0a84ff', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
        { label: type === 'import' ? 'Cleared' : 'Shipped',       value: stats?.completed ?? 0, color: '#30d158', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
        { label: 'In Transit',                                     value: stats?.in_progress ?? 0, color: '#64d2ff', icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0' },
        { label: type === 'import' ? 'Pending' : 'Processing',    value: stats?.pending ?? 0,   color: '#ff9f0a', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    ];

    // ── Loading skeleton ─────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-border border-t-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-5 p-4">

            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-1 text-text-primary">{title}</h1>
                    <p className="text-sm text-text-secondary">{subtitle}</p>
                </div>
                <div className="text-right hidden sm:block shrink-0">
                    <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-sm text-text-secondary">{dateTime.date}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {statCards.map(stat => (
                    <div key={stat.label} className="bg-surface rounded-xl p-4 border border-border shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-3xl font-bold tabular-nums text-text-primary">{stat.value}</p>
                                <p className="text-xs mt-1 font-semibold text-text-secondary">{stat.label}</p>
                            </div>
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${stat.color}20` }}>
                                <StatIcon d={stat.icon} color={stat.color} />
                            </div>
                        </div>
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
                                    <div className="absolute top-full left-0 mt-1 w-32 bg-surface border border-border-strong rounded-xl shadow-lg z-50 overflow-hidden">
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
                                    <div className="absolute top-full left-0 mt-1 w-36 bg-surface border border-border-strong rounded-xl shadow-lg z-[100] overflow-hidden">
                                        {type === 'import' && filterType === 'SC' && (
                                            ['Green', 'Yellow', 'Orange', 'Red'].map(opt => (
                                                <button key={opt} className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-hover transition-colors" onClick={() => { setFilterValue(opt); setOpenDropdown(null); }}>
                                                    {opt}
                                                </button>
                                            ))
                                        )}
                                        {((type === 'import' && filterType === 'Status') || type === 'export') && (
                                            ['pending', 'in_progress', 'completed', 'cancelled'].map(opt => (
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
                        {data.length === 0 ? (
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
