import { useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { useCreateTransaction } from '../hooks/useCreateTransaction';
import { useTransactionList } from '../hooks/useTransactionList';
import { useTransactionStats } from '../hooks/useTransactionStats';
import { useCancelTransaction } from '../hooks/useCancelTransaction';
import { useDebounce } from '../../../hooks/useDebounce';
import type { LayoutContext, CreateImportPayload, CreateExportPayload } from '../types';
import { CancelTransactionModal } from './CancelTransactionModal';
import { EncodeModal } from './EncodeModal';
import { Icon } from '../../../components/Icon';
import { Pagination } from '../../../components/Pagination';

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
        onCancel: (id: number, ref: string) => void
    ) => React.ReactNode;
    mapResponseData: (data: any[]) => T[];
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

    // URL State
    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [filterType, setFilterType] = useState<string>('');
    const [filterValue, setFilterValue] = useState<string>('');
    const [openDropdown, setOpenDropdown] = useState<'filter' | 'colour' | null>(null);

    // Modal State
    const [isEncodeModalOpen, setIsEncodeModalOpen] = useState(false);
    const [cancelTarget, setCancelTarget] = useState<{ id: number; ref: string } | null>(null);

    // Queries & Mutations
    const statsQuery = useTransactionStats(type);
    const createMutation = useCreateTransaction(type);
    const cancelMutation = useCancelTransaction(type);

    const { data: response, isLoading, isFetching } = useTransactionList(type as any, {
        search: debouncedSearch,
        status: filterType === 'Status' ? filterValue : undefined,
        selective_color: filterType === 'SC' ? filterValue : undefined,
        page,
        per_page: perPage,
    });

    const data = useMemo(() => mapResponseData(response?.data ?? []), [response, mapResponseData]);
    const stats = statsQuery.data;

    // Handlers
    const setPage = (newPage: number) => {
        setSearchParams((prev) => { prev.set('page', String(newPage)); return prev; });
    };
    const setPerPage = (newPerPage: number) => {
        setSearchParams((prev) => { prev.set('per_page', String(newPerPage)); prev.set('page', '1'); return prev; });
    };
    const handleReset = () => {
        setFilterType('');
        setFilterValue('');
        setOpenDropdown(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                <div className="text-right hidden sm:block">
                    <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-sm text-text-secondary">{dateTime.date}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    {
                        label: 'Total',
                        value: (stats?.completed ?? 0) + (stats?.pending ?? 0) + (stats?.in_progress ?? 0) + (stats?.cancelled ?? 0),
                        color: '#0a84ff', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
                    },
                    {
                        label: type === 'import' ? 'Cleared' : 'Shipped',
                        value: stats?.completed ?? 0,
                        color: '#30d158', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    },
                    {
                        label: 'In Transit',
                        value: stats?.in_progress ?? 0,
                        color: '#64d2ff', icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0'
                    },
                    {
                        label: type === 'import' ? 'Pending' : 'Processing',
                        value: stats?.pending ?? 0,
                        color: '#ff9f0a', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                    },
                ].map(stat => (
                    <div key={stat.label} className="bg-surface-tint rounded-lg p-4 border border-border-tint">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-3xl font-bold tabular-nums text-text-primary">{stat.value}</p>
                                <p className="text-xs mt-1 text-text-secondary">{stat.label}</p>
                            </div>
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}20` }}>
                                <svg className="w-4.5 h-4.5" fill="none" stroke={stat.color} viewBox="0 0 24 24" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                                </svg>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* List */}
            <div className={`bg-surface rounded-lg border border-border transition-all duration-300 overflow-hidden ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
                {/* Toolbar */}
                <div className="p-3 border-b border-border flex flex-col sm:flex-row gap-3 items-stretch justify-between bg-surface-subtle">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="relative flex-1 max-w-sm">
                            <Icon name="search" className="w-3.5 h-3.5 xl:w-4 xl:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                placeholder={`Search ${type}s...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 h-9 rounded-md border border-border-strong bg-input-bg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/50"
                            />
                        </div>

                        {type === 'import' && (
                            <div className="relative">
                                <button onClick={() => setOpenDropdown(openDropdown === 'filter' ? null : 'filter')} className="px-3 h-9 rounded-md border border-border-strong bg-input-bg text-text-secondary text-xs font-semibold flex items-center justify-between">
                                    {filterType || 'Filter'} <Icon name="chevron-down" className="w-3.5 h-3.5 ml-2" />
                                </button>
                                {openDropdown === 'filter' && (
                                    <div className="absolute top-full left-0 mt-1 w-32 bg-surface-elevated border border-border-strong rounded-lg shadow-lg z-50">
                                        {['SC', 'Status'].map(opt => (
                                            <div key={opt} className="px-4 py-2 text-sm cursor-pointer hover:bg-hover" onClick={() => { setFilterType(opt); setOpenDropdown(null); }}>{opt}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {(filterType || type === 'export') && (
                            <div className="relative">
                                <button onClick={() => setOpenDropdown(openDropdown === 'colour' ? null : 'colour')} className="px-3 h-9 rounded-md border border-border-strong bg-input-bg text-text-secondary text-xs font-semibold flex items-center justify-between">
                                    {filterValue || 'Value'} <Icon name="chevron-down" className="w-3.5 h-3.5 ml-2" />
                                </button>
                                {openDropdown === 'colour' && (
                                    <div className="absolute top-full left-0 mt-1 w-32 bg-surface-elevated border border-border-strong rounded-lg shadow-lg z-[100]">
                                        {type === 'import' && filterType === 'SC' && ['Green', 'Yellow', 'Orange', 'Red'].map(opt => (
                                            <div key={opt} className="px-4 py-2 text-sm cursor-pointer hover:bg-hover" onClick={() => { setFilterValue(opt); setOpenDropdown(null); }}>{opt}</div>
                                        ))}
                                        {((type === 'import' && filterType === 'Status') || type === 'export') && ['pending', 'in_progress', 'completed', 'cancelled'].map(opt => (
                                            <div key={opt} className="px-4 py-2 text-sm cursor-pointer hover:bg-hover" onClick={() => { setFilterValue(opt); setOpenDropdown(null); }}>{opt}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {(filterType || filterValue) && (
                            <button onClick={handleReset} className="px-3 h-9 rounded-md text-xs font-semibold border border-border-strong text-text-secondary hover:text-text-primary">
                                Clear
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setIsEncodeModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 h-9 rounded-md text-xs font-bold shadow-sm bg-gradient-to-br from-blue-600 to-indigo-700 text-white"
                    >
                        <Icon name="plus" className="w-3.5 h-3.5" /> {encodeButtonLabel}
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid gap-4 pb-3 border-b border-border mb-3 px-2 font-bold" style={{ gridTemplateColumns }}>
                        {renderHeaders()}
                    </div>
                    <div>
                        {data.map((row, i) => (
                            <div key={i} className={`grid gap-4 py-3 items-center cursor-pointer transition-all px-4 hover:bg-hover/80 border-b border-border/50 ${i % 2 !== 0 ? 'bg-surface-secondary/40' : ''}`} style={{ gridTemplateColumns }} onClick={() => navigate(`/tracking/${(row as any).ref}`)}>
                                {renderRow(row, i, navigate, (id: number, ref: string) => setCancelTarget({ id, ref }))}
                            </div>
                        ))}
                    </div>
                    <Pagination
                        currentPage={response?.meta?.current_page || 1}
                        totalPages={response?.meta?.last_page || 1}
                        perPage={perPage}
                        onPageChange={setPage}
                        onPerPageChange={setPerPage}
                    />
                </div>
            </div>

            <EncodeModal
                isOpen={isEncodeModalOpen}
                onClose={() => setIsEncodeModalOpen(false)}
                type={type}
                onSave={async (d) => { await createMutation.mutateAsync(type === 'import' ? d as CreateImportPayload : d as CreateExportPayload); }}
            />

            <CancelTransactionModal
                isOpen={!!cancelTarget}
                onClose={() => setCancelTarget(null)}
                transactionRef={cancelTarget?.ref || ''}
                isLoading={cancelMutation.isPending}
                onConfirm={(reason) => {
                    if (cancelTarget) {
                        cancelMutation.mutate(
                            { id: cancelTarget.id, reason },
                            { onSuccess: () => setCancelTarget(null) }
                        );
                    }
                }}
            />
        </div>
    );
}
