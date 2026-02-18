import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { useCancelExport } from '../hooks/useCancelExport';
import { useCreateExport } from '../hooks/useCreateExport';
import { useExports } from '../hooks/useExports';
import { useExportStats } from '../hooks/useExportStats';
import type { CreateExportPayload, ExportTransaction, LayoutContext } from '../types';
import { CancelTransactionModal } from './CancelTransactionModal';
import { EncodeModal } from './EncodeModal';

import { Icon } from '../../../components/Icon';
import { Pagination } from '../../../components/Pagination';
import { PageHeader } from './shared/PageHeader';

export const ExportList = () => {
    const navigate = useNavigate();
    const [isEncodeModalOpen, setIsEncodeModalOpen] = useState(false);
    const createExport = useCreateExport();
    const cancelExport = useCancelExport();
    const [cancelTarget, setCancelTarget] = useState<{ id: number; ref: string } | null>(null);

    const { user } = useOutletContext<LayoutContext>();

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
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
    const [openDropdown, setOpenDropdown] = useState(false);

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

    const { data: response, isLoading, isFetching } = useExports({
        search: debouncedSearch,
        status: statusFilter,
        page,
        per_page: perPage,
    });

    const data = useMemo<ExportTransaction[]>(() => {
        if (!response?.data) return [];
        return response.data.map(t => ({
            id: t.id,
            ref: `EXP-${String(t.id).padStart(4, '0')}`,
            bl: t.bl_no,
            status: t.status === 'pending' ? 'Processing' : t.status === 'in_progress' ? 'In Transit' : t.status === 'completed' ? 'Shipped' : 'Delayed',
            color: '',
            shipper: t.shipper?.name || 'Unknown',
            vessel: t.vessel || '',
            departureDate: t.created_at ? new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
            portOfDestination: t.destination_country?.name || '',
        }));
    }, [response]);

    // Use stats API for accurate total counts (not just current page)
    const { data: stats } = useExportStats();



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
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title="Export Transactions"
                breadcrumb="Dashboard / Export Transactions"
                user={user || null}
            />

            {/* Stats Row - Apple Icon Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    {
                        label: 'Total',
                        value: (stats?.completed ?? 0) + (stats?.pending ?? 0) + (stats?.in_progress ?? 0) + (stats?.cancelled ?? 0),
                        sub: 'All shipments',
                        color: '#0a84ff',
                        icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
                    },
                    {
                        label: 'Shipped',
                        value: stats?.completed ?? 0,
                        sub: 'Completed',
                        color: '#30d158',
                        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                    },
                    {
                        label: 'In Transit',
                        value: stats?.in_progress ?? 0,
                        sub: 'En route',
                        color: '#64d2ff',
                        icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
                    },
                    {
                        label: 'Processing',
                        value: stats?.pending ?? 0,
                        sub: 'Preparing',
                        color: '#ff9f0a',
                        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                    },
                ].map(stat => (
                    <div key={stat.label} className="bg-surface-tint rounded-xl p-4 border border-border-tint">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-3xl font-bold tabular-nums text-text-primary">{stat.value}</p>
                                <p className="text-xs mt-1 text-text-secondary font-medium">{stat.label}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}22` }}>
                                <svg className="w-5 h-5" fill="none" stroke={stat.color} viewBox="0 0 24 24" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs text-text-muted mt-2">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* Controls Bar Above the List Card */}
            <div className="flex justify-end items-center mb-6 px-2">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search anything"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-input-bg rounded-2xl border border-border-strong text-sm w-64 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-text-primary font-medium transition-all duration-200"
                        />
                        <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setOpenDropdown(!openDropdown)}
                            className="pl-4 pr-8 py-2 text-sm rounded-2xl border border-border-strong bg-input-bg text-text-secondary font-bold min-w-[120px] text-left relative flex items-center justify-between focus:outline-none transition-all hover:border-gray-300"
                        >
                            {statusFilter || 'Status'}
                            <Icon name="chevron-down" className="w-4 h-4 ml-2 text-text-muted absolute right-2" />
                        </button>

                        {openDropdown && (
                            <div className="absolute top-full right-0 mt-1 w-40 bg-surface-elevated border border-border-strong rounded-xl shadow-lg z-[100] py-1">
                                {['Shipped', 'Processing', 'Delayed', 'In Transit'].map((status) => (
                                    <div
                                        key={status}
                                        className="px-4 py-2 hover:bg-hover cursor-pointer text-sm text-text-primary font-medium"
                                        onClick={() => {
                                            setStatusFilter(status);
                                            setOpenDropdown(false);
                                        }}
                                    >
                                        {status}
                                    </div>
                                ))}
                                {statusFilter && (
                                    <div
                                        className="px-4 py-2 hover:bg-red-50 cursor-pointer text-sm text-red-600 font-bold border-t border-border"
                                        onClick={() => {
                                            setStatusFilter('');
                                            setOpenDropdown(false);
                                        }}
                                    >
                                        Clear Filter
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setIsEncodeModalOpen(true)}
                        className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center shadow-sm transition-all border border-blue-700/20"
                        title="Encode new transaction"
                    >
                        <Icon name="plus" className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Transaction List Card */}
            <div className={`bg-surface rounded-xl border border-border transition-all duration-300 ease-in-out overflow-hidden ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
                <div className="p-6">
                    {/* Table Header */}
                    <div className="grid gap-4 pb-3 border-b border-border mb-3 px-2 font-bold"
                        style={{ gridTemplateColumns: '1.4fr 1.4fr 1.5fr 1.4fr 1.5fr 100px' }}>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Shipper</span>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Bill of Lading</span>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Vessel</span>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Departure Date</span>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Port of Destination</span>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Actions</span>
                    </div>

                    {/* Table Rows */}
                    <div className="space-y-1">
                        {filteredData.map((row, i) => (
                            <div
                                key={i}
                                onClick={() => navigate(`/tracking/${row.ref}`)}
                                className="grid gap-4 py-2 items-center cursor-pointer rounded-xl transition-all duration-200 px-2 hover:bg-hover hover:shadow-sm"
                                style={{ gridTemplateColumns: '1.4fr 1.4fr 1.5fr 1.4fr 1.5fr 100px' }}
                            >
                                <p className="text-sm text-text-secondary font-bold">{row.shipper}</p>
                                <p className="text-sm text-text-secondary font-bold">{row.bl}</p>
                                <p className="text-sm text-text-secondary font-bold">{row.vessel}</p>
                                <p className="text-sm font-bold text-text-primary">{row.departureDate}</p>
                                <p className="text-sm text-text-secondary font-bold">{row.portOfDestination}</p>
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
                                        className={`p-1.5 rounded-md transition-colors ${row.status === 'Processing' || row.status === 'In Transit'
                                            ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 cursor-pointer'
                                            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                            }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (row.status === 'Processing' || row.status === 'In Transit') {
                                                setCancelTarget({ id: row.id, ref: row.ref });
                                            }
                                        }}
                                        disabled={row.status !== 'Processing' && row.status !== 'In Transit'}
                                        title={row.status === 'Processing' || row.status === 'In Transit'
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
                type="export"
                onSave={async (data) => {
                    await createExport.mutateAsync(data as CreateExportPayload);
                }}
            />

            <CancelTransactionModal
                isOpen={!!cancelTarget}
                onClose={() => setCancelTarget(null)}
                transactionRef={cancelTarget?.ref || ''}
                isLoading={cancelExport.isPending}
                onConfirm={(reason) => {
                    if (cancelTarget) {
                        cancelExport.mutate(
                            { id: cancelTarget.id, reason },
                            { onSuccess: () => setCancelTarget(null) }
                        );
                    }
                }}
            />
        </div>
    );
};
