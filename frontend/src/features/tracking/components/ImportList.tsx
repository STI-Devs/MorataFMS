import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { useCancelImport } from '../hooks/useCancelImport';
import { useCreateImport } from '../hooks/useCreateImport';
import { useImports } from '../hooks/useImports';
import { useImportStats } from '../hooks/useImportStats';
import type { CreateImportPayload, ImportTransaction, LayoutContext } from '../types';
import { CancelTransactionModal } from './CancelTransactionModal';
import { EncodeModal } from './EncodeModal';

import { Icon } from '../../../components/Icon';
import { Pagination } from '../../../components/Pagination';
import { PageHeader } from './shared/PageHeader';

export const ImportList = () => {
    const navigate = useNavigate();
    const [filterType, setFilterType] = useState<string>('');
    const [filterValue, setFilterValue] = useState<string>('');
    const [openDropdown, setOpenDropdown] = useState<'filter' | 'colour' | null>(null);
    const [isEncodeModalOpen, setIsEncodeModalOpen] = useState(false);
    const createImport = useCreateImport();
    const cancelImport = useCancelImport();
    const [cancelTarget, setCancelTarget] = useState<{ id: number; ref: string } | null>(null);

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

    const PLACEHOLDER_IMPORTS: ImportTransaction[] = [
        { id: 1001, ref: 'IMP-2401', bl: 'MOLU2401001', status: 'Cleared', color: 'bg-green-500', importer: 'Pacific Traders Inc.', date: 'Feb 15, 2025' },
        { id: 1002, ref: 'IMP-2402', bl: 'MOLU2401002', status: 'Pending', color: 'bg-yellow-500', importer: 'Global Imports Co.', date: 'Feb 18, 2025' },
        { id: 1003, ref: 'IMP-2403', bl: 'COSU2401003', status: 'In Transit', color: 'bg-green-500', importer: 'Davao Cargo Solutions', date: 'Feb 20, 2025' },
        { id: 1004, ref: 'IMP-2404', bl: 'HLCU2401004', status: 'Cleared', color: 'bg-green-500', importer: 'Mindanao Freight Ltd.', date: 'Jan 31, 2025' },
        { id: 1005, ref: 'IMP-2405', bl: 'MSCU2401005', status: 'In Transit', color: 'bg-yellow-500', importer: 'Cebu Port Authority', date: 'Mar 01, 2025' },
        { id: 1006, ref: 'IMP-2406', bl: 'OOLU2401006', status: 'Delayed', color: 'bg-red-500', importer: 'Manila Bay Logistics', date: 'Jan 16, 2025' },
        { id: 1007, ref: 'IMP-2407', bl: 'YMLU2401007', status: 'Pending', color: 'bg-yellow-500', importer: 'Southern Cross Trading', date: 'Mar 05, 2025' },
        { id: 1008, ref: 'IMP-2408', bl: 'EGLV2401008', status: 'Cleared', color: 'bg-green-500', importer: 'Visayas Import Group', date: 'Dec 31, 2024' },
    ];

    const data = useMemo<ImportTransaction[]>(() => {
        if (!response?.data || response.data.length === 0) return PLACEHOLDER_IMPORTS;
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
    const { user } = useOutletContext<LayoutContext>();

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
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title="Import Transactions"
                breadcrumb="Dashboard / Import Transactions"
                user={user || null}
            />

            {/* Stats Row - Apple Icon Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                                <p className="text-xs mt-1 text-text-secondary font-medium">{stat.label}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}22` }}>
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
                        <Icon name="filter" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary z-10 pointer-events-none" />
                        <button
                            onClick={() => setOpenDropdown(openDropdown === 'filter' ? null : 'filter')}
                            className="pl-9 pr-8 py-2 text-sm rounded-2xl border border-border-strong bg-input-bg text-text-secondary font-bold min-w-[100px] text-left relative flex items-center justify-between focus:outline-none transition-all hover:border-gray-300"
                        >
                            {filterType || 'Filter'}
                            <Icon name="chevron-down" className="w-4 h-4 ml-2 text-text-muted absolute right-2" />
                        </button>

                        {openDropdown === 'filter' && (
                            <div className="absolute top-full left-0 mt-1 w-full bg-surface-elevated border border-border-strong rounded-lg shadow-lg z-[100] py-1">
                                {['SC', 'Status'].map((opt) => (
                                    <div
                                        key={opt}
                                        className="px-4 py-2 hover:bg-hover cursor-pointer text-sm text-text-primary font-medium"
                                        onClick={() => {
                                            setFilterType(opt);
                                            setOpenDropdown(null);
                                        }}
                                    >
                                        {opt}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setOpenDropdown(openDropdown === 'colour' ? null : 'colour')}
                            className="pr-8 py-2 pl-3 text-sm rounded-2xl border border-border-strong bg-input-bg text-text-secondary font-bold min-w-[140px] text-left relative flex items-center justify-between focus:outline-none transition-all hover:border-gray-300"
                        >
                            {filterValue || 'Colour'}
                            <Icon name="chevron-down" className="w-4 h-4 ml-2 text-text-muted absolute right-2" />
                        </button>

                        {openDropdown === 'colour' && (
                            <div className="absolute top-full left-0 mt-1 w-full bg-surface-elevated border border-border-strong rounded-lg shadow-lg z-[100] py-1">
                                {filterType === 'SC' && ['Green', 'Yellow', 'Orange', 'Red'].map((color) => (
                                    <div
                                        key={color}
                                        className="px-4 py-2 hover:bg-hover cursor-pointer text-sm text-text-primary font-medium"
                                        onClick={() => {
                                            setFilterValue(color);
                                            setOpenDropdown(null);
                                        }}
                                    >
                                        {color}
                                    </div>
                                ))}
                                {filterType === 'Status' && ['Green', 'Yellow', 'Orange', 'Red', 'Blue'].map((color) => (
                                    <div
                                        key={color}
                                        className="px-4 py-2 hover:bg-hover cursor-pointer text-sm text-text-primary font-medium"
                                        onClick={() => {
                                            setFilterValue(color);
                                            setOpenDropdown(null);
                                        }}
                                    >
                                        {color}
                                    </div>
                                ))}
                                {!filterType && (
                                    <div className="px-4 py-2 text-sm text-text-muted italic font-medium">Select Filter first</div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            onClick={handleReset}
                            className="bg-input-bg border border-border-strong text-text-secondary text-xs font-bold py-2.5 px-6 rounded-lg uppercase tracking-wider transition-all hover:border-gray-300 shadow-sm"
                        >
                            DEFAULT
                        </button>
                        <button
                            onClick={() => setIsEncodeModalOpen(true)}
                            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center shadow-sm transition-all border border-blue-700/20"
                            title="Encode new transaction"
                        >
                            <Icon name="plus" className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Transaction List Card */}
            <div className={`bg-surface rounded-lg border border-border transition-all duration-300 ease-in-out overflow-hidden ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
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
                    <div className="space-y-1">
                        {filteredData.map((row, i) => (
                            <div
                                key={i}
                                onClick={() => navigate(`/tracking/${row.ref}`)}
                                className="grid gap-4 py-2 items-center cursor-pointer rounded-lg transition-all duration-200 px-2 hover:bg-hover hover:shadow-sm group"
                                style={{ gridTemplateColumns: '50px 1.2fr 1.2fr 1fr 1.5fr 1fr 80px' }}
                            >
                                <span className={`w-2.5 h-2.5 rounded-full ${row.color}`}></span>
                                <p className="text-sm text-text-primary font-bold">{row.ref}</p>
                                <p className="text-sm text-text-secondary font-bold">{row.bl}</p>
                                <span className="inline-flex">
                                    <span
                                        className="px-2.5 py-0.5 rounded-full text-[10px] font-black text-white uppercase tracking-wider shadow-sm border border-black/5"
                                        style={{
                                            backgroundColor: row.status === 'Cleared' ? '#4cd964' :
                                                row.status === 'Pending' ? '#ffcc00' :
                                                    row.status === 'Delayed' ? '#ff2d55' : '#00d2ff'
                                        }}
                                    >
                                        {row.status}
                                    </span>
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
