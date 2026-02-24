import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { useCancelImport } from '../hooks/useCancelImport';
import { useCreateImport } from '../hooks/useCreateImport';
import { useImports } from '../hooks/useImports';
import { useImportStats } from '../hooks/useImportStats';
import { usePrefetchEncodeData } from '../hooks/usePrefetchEncodeData';
import type { CreateImportPayload, ImportTransaction, LayoutContext } from '../types';
import { CancelTransactionModal } from './modals/CancelTransactionModal';
import { EncodeModal } from './modals/EncodeModal';

import { Icon } from '../../../components/Icon';
import { Pagination } from '../../../components/Pagination';

export const ImportList = () => {
    const navigate = useNavigate();
    const [filterType, setFilterType] = useState<string>('');
    const [filterValue, setFilterValue] = useState<string>('');
    const [openDropdown, setOpenDropdown] = useState<'filter' | 'colour' | null>(null);
    const [isEncodeModalOpen, setIsEncodeModalOpen] = useState(false);
    const createImport = useCreateImport();
    const cancelImport = useCancelImport();
    const [cancelTarget, setCancelTarget] = useState<{ id: number; ref: string } | null>(null);

    usePrefetchEncodeData('import');

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');

    const setPage = (newPage: number) => {
        setSearchParams((prev: URLSearchParams) => {
            prev.set('page', String(newPage));
            return prev;
        });
    };

    const setPerPage = (newPerPage: number) => {
        setSearchParams((prev: URLSearchParams) => {
            prev.set('per_page', String(newPerPage));
            prev.set('page', '1'); // Reset to first page
            return prev;
        });
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            if (searchQuery !== '') {
                setPage(1);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { data: response, isLoading, isFetching } = useImports({
        search: debouncedSearch,
        status: filterType === 'Status' ? filterValue : undefined,
        selective_color: filterType === 'SC' ? filterValue : undefined,
        page,
        per_page: perPage,
    });

    const data = useMemo<ImportTransaction[]>(() => {
        if (!response?.data) return [];
        return response.data.map(t => ({
            id: t.id,
            ref: t.customs_ref_no,
            bl: t.bl_no,
            status: t.status === 'pending' ? 'Pending' : t.status === 'in_progress' ? 'In Transit' : t.status === 'completed' ? 'Cleared' : 'Delayed',
            color: t.selective_color === 'green' ? 'bg-green-500' : t.selective_color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500',
            importer: t.importer?.name || 'Unknown',
            date: t.arrival_date || '',
        }));
    }, [response]);

    const handleReset = () => {
        setFilterType('');
        setFilterValue('');
        setOpenDropdown(null);
    };
    const { dateTime } = useOutletContext<LayoutContext>();

    // Use stats API for accurate total counts (not just current page)
    const { data: stats } = useImportStats();

    // Server-side filtering is now handled by the API
    const filteredData = data;

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
                    <h1 className="text-3xl font-bold mb-1 text-text-primary">Import Transactions</h1>
                    <p className="text-sm text-text-secondary">Track and manage all import shipments</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-sm text-text-secondary">{dateTime.date}</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    {
                        label: 'Total',
                        value: (stats?.completed ?? 0) + (stats?.pending ?? 0) + (stats?.in_progress ?? 0) + (stats?.cancelled ?? 0),
                        sub: 'All transactions',
                        color: '#0a84ff',
                        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
                    },
                    {
                        label: 'Cleared',
                        value: stats?.completed ?? 0,
                        sub: 'Completed',
                        color: '#30d158',
                        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                    },
                    {
                        label: 'In Transit',
                        value: stats?.in_progress ?? 0,
                        sub: 'Processing',
                        color: '#64d2ff',
                        icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
                    },
                    {
                        label: 'Pending',
                        value: stats?.pending ?? 0,
                        sub: 'Awaiting',
                        color: '#ff9f0a',
                        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
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

            {/* Transaction List Card */}
            <div className={`bg-surface rounded-lg border border-border transition-all duration-300 ease-in-out overflow-hidden ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
                {/* Controls - integrated into the card */}
                <div className="p-3 border-b border-border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-surface-subtle">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="relative flex-1 max-w-sm">
                            <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search imports..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 h-9 rounded-md border border-border-strong bg-input-bg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setOpenDropdown(openDropdown === 'filter' ? null : 'filter')}
                                className="px-3 h-9 rounded-md border border-border-strong bg-input-bg text-text-secondary text-xs font-semibold min-w-[100px] text-left flex items-center justify-between focus:outline-none transition-colors hover:text-text-primary"
                            >
                                {filterType || 'Filter'}
                                <Icon name="chevron-down" className="w-3.5 h-3.5 ml-2 text-text-muted" />
                            </button>
                            {openDropdown === 'filter' && (
                                <div className="absolute top-full left-0 mt-1 w-full bg-surface-elevated border border-border-strong rounded-lg shadow-lg z-[100] py-1">
                                    {['SC', 'Status'].map((opt) => (
                                        <div key={opt} className="px-4 py-2 hover:bg-hover cursor-pointer text-sm text-text-primary" onClick={() => { setFilterType(opt); setOpenDropdown(null); }}>{opt}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setOpenDropdown(openDropdown === 'colour' ? null : 'colour')}
                                className="px-3 h-9 rounded-md border border-border-strong bg-input-bg text-text-secondary text-xs font-semibold min-w-[120px] text-left flex items-center justify-between focus:outline-none transition-colors hover:text-text-primary"
                            >
                                {filterValue || 'Colour'}
                                <Icon name="chevron-down" className="w-3.5 h-3.5 ml-2 text-text-muted" />
                            </button>
                            {openDropdown === 'colour' && (
                                <div className="absolute top-full left-0 mt-1 w-full bg-surface-elevated border border-border-strong rounded-lg shadow-lg z-[100] py-1">
                                    {filterType === 'SC' && ['Green', 'Yellow', 'Orange', 'Red'].map((color) => (
                                        <div key={color} className="px-4 py-2 hover:bg-hover cursor-pointer text-sm text-text-primary" onClick={() => { setFilterValue(color); setOpenDropdown(null); }}>{color}</div>
                                    ))}
                                    {filterType === 'Status' && ['Green', 'Yellow', 'Orange', 'Red', 'Blue'].map((color) => (
                                        <div key={color} className="px-4 py-2 hover:bg-hover cursor-pointer text-sm text-text-primary" onClick={() => { setFilterValue(color); setOpenDropdown(null); }}>{color}</div>
                                    ))}
                                    {!filterType && <div className="px-4 py-2 text-sm text-text-muted italic">Select Filter first</div>}
                                </div>
                            )}
                        </div>
                        {(filterType || filterValue) && (
                            <button onClick={handleReset} className="px-3 h-9 rounded-md text-xs font-semibold border border-border-strong bg-input-bg text-text-secondary hover:text-text-primary transition-colors">
                                Clear
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setIsEncodeModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 h-9 rounded-md text-xs font-bold transition-all shadow-sm"
                        style={{ backgroundColor: '#0a84ff', color: '#fff' }}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Encode Import
                    </button>
                </div>
                <div className="p-6">
                    {/* Table Header */}
                    <div className="grid gap-4 pb-3 border-b border-border mb-3 px-2 font-bold"
                        style={{ gridTemplateColumns: '50px 1.2fr 1.2fr 1fr 1.5fr 1fr 80px' }}>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">BLSC</span>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Customs Ref No.</span>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Bill of Lading</span>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Status</span>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Importer</span>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Arrival Date</span>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Actions</span>
                    </div>

                    {/* Table Rows */}
                    <div className="">
                        {filteredData.map((row, i) => (
                            <div
                                key={i}
                                onClick={() => navigate(`/tracking/${row.ref}`)}
                                className={`grid gap-4 py-3 items-center cursor-pointer transition-all duration-200 px-4 hover:bg-hover border-b border-border/50 ${i % 2 !== 0 ? 'bg-surface-secondary/40' : ''}`}
                                style={{ gridTemplateColumns: '50px 1.2fr 1.2fr 1fr 1.5fr 1fr 80px' }}
                            >
                                <span className={`w-2.5 h-2.5 rounded-full ${row.color}`}></span>
                                <p className="text-sm text-text-primary font-bold">{row.ref}</p>
                                <p className="text-sm text-text-secondary font-bold">{row.bl}</p>
                                <span className="inline-flex">
                                    {(() => {
                                        const getStatusStyle = (status: string) => {
                                            switch (status) {
                                                case 'Cleared': return { color: '#30d158', bg: 'rgba(48,209,88,0.13)' };
                                                case 'Pending': return { color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' };
                                                case 'Delayed': return { color: '#ff453a', bg: 'rgba(255,69,58,0.13)' };
                                                default: return { color: '#64d2ff', bg: 'rgba(100,210,255,0.13)' };
                                            }
                                        };
                                        const s = getStatusStyle(row.status);
                                        return (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold" style={{ color: s.color, backgroundColor: s.bg }}>
                                                <span className="w-1.5 h-1.5 rounded-full inline-block shadow-sm" style={{ backgroundColor: s.color, boxShadow: `0 0 4px ${s.color}` }} />
                                                {row.status}
                                            </span>
                                        );
                                    })()}
                                </span>
                                <p className="text-sm text-text-secondary font-bold">{row.importer}</p>
                                <p className="text-sm text-text-secondary font-bold">{row.date}</p>
                                <div className="flex justify-end gap-1.5">
                                    {/* Edit button — always visible */}
                                    <button
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/tracking/${row.ref}`);
                                        }}
                                        title="Edit"
                                    >
                                        <Icon name="edit" className="w-4 h-4" />
                                    </button>
                                    {/* Cancel button — always visible, disabled for non-cancellable */}
                                    <button
                                        className={`p-1.5 rounded-md transition-colors ${row.status === 'Pending' || row.status === 'In Transit'
                                            ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 cursor-pointer'
                                            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                            }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (row.status === 'Pending' || row.status === 'In Transit') {
                                                setCancelTarget({ id: row.id, ref: row.ref });
                                            }
                                        }}
                                        disabled={row.status !== 'Pending' && row.status !== 'In Transit'}
                                        title={row.status === 'Pending' || row.status === 'In Transit'
                                            ? 'Cancel Transaction'
                                            : 'Cannot cancel — transaction is ' + row.status.toLowerCase()}
                                    >
                                        <Icon name="x" className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Table Pagination */}
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
                type="import"
                onSave={async (data) => {
                    await createImport.mutateAsync(data as CreateImportPayload);
                }}
            />

            <CancelTransactionModal
                isOpen={!!cancelTarget}
                onClose={() => setCancelTarget(null)}
                transactionRef={cancelTarget?.ref || ''}
                isLoading={cancelImport.isPending}
                onConfirm={(reason) => {
                    if (cancelTarget) {
                        cancelImport.mutate(
                            { id: cancelTarget.id, reason },
                            { onSuccess: () => setCancelTarget(null) }
                        );
                    }
                }}
            />
        </div>
    );
};
