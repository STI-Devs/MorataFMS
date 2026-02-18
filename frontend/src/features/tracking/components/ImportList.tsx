import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { useCancelImport } from '../hooks/useCancelImport';
import { useCreateImport } from '../hooks/useCreateImport';
import { useImports } from '../hooks/useImports';
import { useImportStats } from '../hooks/useImportStats';
import type { ApiImportTransaction, CreateImportPayload, LayoutContext } from '../types';
import { CalendarCard } from './CalendarCard';
import { CancelTransactionModal } from './CancelTransactionModal';
import { EncodeModal } from './EncodeModal';
import { StatusChart } from './StatusChart';

// Extend the local ImportTransaction type to include origin country
interface ImportRow {
    id: number;
    ref: string;
    bl: string;
    status: string;
    color: string;
    importer: string;
    originCountry: string;
    date: string;
}

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

    const data = useMemo<ImportRow[]>(() => {
        if (!response?.data) return [];
        return response.data.map((t: ApiImportTransaction) => ({
            id: t.id,
            ref: t.customs_ref_no,
            bl: t.bl_no,
            status: t.status === 'pending' ? 'Pending' : t.status === 'in_progress' ? 'In Transit' : t.status === 'completed' ? 'Cleared' : 'Delayed',
            color: t.selective_color === 'green' ? 'bg-green-500' : t.selective_color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500',
            importer: t.importer?.name || 'Unknown',
            originCountry: t.origin_country?.name || '—',
            date: t.arrival_date || '',
        }));
    }, [response]);

    const handleReset = () => {
        setFilterType('');
        setFilterValue('');
        setOpenDropdown(null);
    };
    const { user, dateTime } = useOutletContext<LayoutContext>();

    // Use stats API for accurate total counts (not just current page)
    const { data: stats } = useImportStats();

    const chartData = [
        { label: 'Cleared', value: stats?.completed || 0, color: '#4cd964' },
        { label: 'Pending', value: stats?.pending || 0, color: '#ffcc00' },
        { label: 'Delayed', value: stats?.cancelled || 0, color: '#ff2d55' },
        { label: 'In Transit', value: stats?.in_progress || 0, color: '#00d2ff' },
    ];

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

            {/* Stats Row - 3 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {/* 1. Time Card */}
                <div className="bg-surface-tint rounded-[2rem] p-5 border border-border-tint shadow-sm flex flex-col items-center justify-center text-center h-full transition-all duration-300 ease-in-out">
                    <h2 className="text-4xl font-bold text-text-primary mb-1 tracking-tight">
                        {dateTime.time}
                    </h2>
                    <p className="text-sm text-text-secondary font-medium mb-4">
                        {dateTime.date}
                    </p>
                    <div className="w-full border-t border-border-tint my-2"></div>
                    <div className="flex items-center gap-2 mt-2 text-text-secondary font-bold text-xs">
                        <svg className="w-4 h-4 text-[#c41e3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Manila, Philippines
                    </div>
                </div>

                {/* 2. Calendar Card */}
                <div className="h-full">
                    <CalendarCard />
                </div>

                {/* 3. Status Chart */}
                <div className="h-full">
                    <StatusChart data={chartData} />
                </div>
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
                            <div className="absolute top-full left-0 mt-1 w-full bg-surface-elevated border border-border-strong rounded-xl shadow-lg z-[100] py-1">
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
                            className="bg-input-bg border border-border-strong text-text-secondary text-xs font-bold py-2.5 px-6 rounded-xl uppercase tracking-wider transition-all hover:border-gray-300 shadow-sm"
                        >
                            DEFAULT
                        </button>
                        <button
                            onClick={() => setIsEncodeModalOpen(true)}
                            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center shadow-sm transition-all border border-blue-700/20"
                            title="Encode new transaction"
                        >
                            <Icon name="plus" className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Transaction List Card */}
            <div className={`bg-surface rounded-[2rem] border border-border shadow-sm transition-all duration-300 ease-in-out overflow-hidden ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
                <div className="p-6">
                    {/* Table Header */}
                    <div className="grid gap-4 pb-3 border-b border-border mb-3 px-2 font-bold"
                        style={{ gridTemplateColumns: '50px 1.2fr 1.2fr 1fr 1.2fr 1fr 1fr 80px' }}>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">BLSC</span>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Customs Ref No.</span>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Bill of Lading</span>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Status</span>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Importer</span>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Origin</span>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Arrival Date</span>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Actions</span>
                    </div>

                    {/* Table Rows */}
                    <div className="space-y-1">
                        {filteredData.map((row, i) => (
                            <div
                                key={i}
                                onClick={() => navigate(`/tracking/${row.ref}`)}
                                className="grid gap-4 py-2 items-center cursor-pointer rounded-xl transition-all duration-200 px-2 hover:bg-hover hover:shadow-sm group"
                                style={{ gridTemplateColumns: '50px 1.2fr 1.2fr 1fr 1.2fr 1fr 1fr 80px' }}
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
                                <p className="text-sm text-text-muted font-medium">{row.originCountry}</p>
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
                                        className={`p-1.5 rounded-md transition-colors ${
                                            row.status === 'Pending' || row.status === 'In Transit'
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
