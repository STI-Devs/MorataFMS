import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { useConfirmationModal } from '../../../hooks/useConfirmationModal';
import { mockTrackingApi } from '../api/mockTrackingApi';
import type { ImportTransaction, LayoutContext } from '../types';
import { CalendarCard } from './CalendarCard';
import { StatusChart } from './StatusChart';

import { Icon } from '../../../components/Icon';
import { Pagination } from '../../../components/Pagination';
import { PageHeader } from './shared/PageHeader';

export const ImportList = () => {
    const navigate = useNavigate();
    const [filterType, setFilterType] = useState<string>('');
    const [filterValue, setFilterValue] = useState<string>('');
    const [openDropdown, setOpenDropdown] = useState<'filter' | 'colour' | null>(null);
    const { openModal, modalProps } = useConfirmationModal();

    const [data, setData] = useState<ImportTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const result = await mockTrackingApi.getAllImports();
                setData(result);
            } catch (err) {
                console.error("Failed to load imports", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleReset = () => {
        setFilterType('');
        setFilterValue('');
        setOpenDropdown(null);
    };
    const { user, dateTime } = useOutletContext<LayoutContext>();

    // Calculate status counts
    const statusCounts = data.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const chartData = [
        { label: 'Cleared', value: statusCounts['Cleared'] || 0, color: '#4cd964' },
        { label: 'Pending', value: statusCounts['Pending'] || 0, color: '#ffcc00' },
        { label: 'Delayed', value: statusCounts['Delayed'] || 0, color: '#ff2d55' },
        { label: 'In Transit', value: statusCounts['In Transit'] || 0, color: '#00d2ff' },
    ];

    const filteredData = data.filter(item => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = item.ref.toLowerCase().includes(query) ||
                              item.bl.toLowerCase().includes(query) ||
                              item.importer.toLowerCase().includes(query);
        
        let matchesFilter = true;
        if (filterType === 'Status' && filterValue) {
             matchesFilter = item.status === filterValue;
        } else if (filterType === 'SC' && filterValue) {
             matchesFilter = item.color.includes(filterValue.toLowerCase());
        }

        return matchesSearch && matchesFilter;
    });

    if (loading) {
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
                <div className="bg-blue-50 dark:bg-gray-900 rounded-[2rem] p-5 border border-blue-100 dark:border-gray-800 shadow-sm dark:shadow-none flex flex-col items-center justify-center text-center h-full transition-all duration-300 ease-in-out">
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">
                        {dateTime.time}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-4">
                        {dateTime.date}
                    </p>
                    <div className="w-full border-t border-blue-100 dark:border-gray-800 my-2"></div>
                    <div className="flex items-center gap-2 mt-2 text-gray-600 dark:text-gray-300 font-bold text-xs">
                        <svg className="w-4 h-4 text-[#c41e3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Manila, Philippines
                    </div>
                </div>

                {/* 2. Calendar Card */}
                <div className="h-full">
                    <CalendarCard className="bg-blue-50 border-blue-100 dark:bg-gray-900 dark:border-gray-800" />
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
                            className="pl-10 pr-4 py-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm w-64 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white font-medium transition-all duration-200"
                        />
                        <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                    </div>
                    <div className="relative">
                        <Icon name="filter" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 z-10 pointer-events-none" />
                        <button
                            onClick={() => setOpenDropdown(openDropdown === 'filter' ? null : 'filter')}
                            className="pl-9 pr-8 py-2 text-sm rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-500 dark:text-gray-300 font-bold min-w-[100px] text-left relative flex items-center justify-between focus:outline-none transition-all hover:border-gray-300 dark:hover:border-gray-600"
                        >
                            {filterType || 'Filter'}
                            <Icon name="chevron-down" className="w-4 h-4 ml-2 text-gray-600 absolute right-2" />
                        </button>

                        {openDropdown === 'filter' && (
                            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-[100] py-1">
                                {['SC', 'Status'].map((opt) => (
                                    <div
                                        key={opt}
                                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-900 font-medium"
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
                            className="pr-8 py-2 pl-3 text-sm rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-500 dark:text-gray-300 font-bold min-w-[140px] text-left relative flex items-center justify-between focus:outline-none transition-all hover:border-gray-300 dark:hover:border-gray-600"
                        >
                            {filterValue || 'Colour'}
                            <Icon name="chevron-down" className="w-4 h-4 ml-2 text-gray-600 absolute right-2" />
                        </button>

                        {openDropdown === 'colour' && (
                            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-[100] py-1">
                                {filterType === 'SC' && ['Green', 'Yellow', 'Orange', 'Red'].map((color) => (
                                    <div
                                        key={color}
                                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-900 font-medium"
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
                                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-900 font-medium"
                                        onClick={() => {
                                            setFilterValue(color);
                                            setOpenDropdown(null);
                                        }}
                                    >
                                        {color}
                                    </div>
                                ))}
                                {!filterType && (
                                    <div className="px-4 py-2 text-sm text-gray-400 italic font-medium">Select Filter first</div>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleReset}
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-slate-500 dark:text-gray-300 text-xs font-bold py-2.5 px-6 rounded-xl uppercase tracking-wider transition-all hover:border-gray-300 dark:hover:border-gray-600 shadow-sm ml-auto"
                    >
                        DEFAULT
                    </button>
                </div>
            </div>

            {/* Transaction List Card */}
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm transition-all duration-300 ease-in-out overflow-hidden">
                <div className="p-6">
                    {/* Table Header */}
                    <div className="grid gap-4 pb-3 border-b border-gray-100 dark:border-gray-800 mb-3 px-2 font-bold"
                        style={{ gridTemplateColumns: '50px 1.2fr 1.2fr 1fr 1.5fr 1fr 80px' }}>
                        <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">BLSC</span>
                        <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Customs Ref No.</span>
                        <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Bill of Lading</span>
                        <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Status</span>
                        <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Importer</span>
                        <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Arrival Date</span>
                        <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</span>
                    </div>

                    {/* Table Rows */}
                    <div className="space-y-1">
                        {filteredData.map((row, i) => (
                            <div
                                key={i}
                                onClick={() => navigate(`/tracking/${row.ref}`)}
                                className="grid gap-4 py-2 items-center cursor-pointer rounded-xl transition-all duration-200 px-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:shadow-sm group"
                                style={{ gridTemplateColumns: '50px 1.2fr 1.2fr 1fr 1.5fr 1fr 80px' }}
                            >
                                <span className={`w-2.5 h-2.5 rounded-full ${row.color}`}></span>
                                <p className="text-sm text-gray-900 dark:text-white font-bold">{row.ref}</p>
                                <p className="text-sm text-slate-500 dark:text-gray-400 font-bold">{row.bl}</p>
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
                                <p className="text-sm text-slate-500 dark:text-gray-400 font-bold">{row.importer}</p>
                                <p className="text-sm text-slate-500 dark:text-gray-400 font-bold">{row.date}</p>
                                <div className="flex justify-end gap-2">
                                    <button
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openModal({
                                                title: 'Edit Transaction',
                                                message: 'Are you sure you want to edit this transaction?',
                                                confirmText: 'Confirm Edit',
                                                confirmButtonClass: 'bg-blue-600 hover:bg-blue-700',
                                                onConfirm: () => {
                                                    navigate(`/tracking/${row.ref}`);
                                                }
                                            });
                                        }}
                                        title="Edit"
                                    >
                                        <Icon name="edit" className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openModal({
                                                title: 'Delete Transaction',
                                                message: 'Are you sure you want to delete this transaction? This action cannot be undone.',
                                                onConfirm: () => {
                                                    /* Logic to delete */
                                                    console.log('Deleted', row.ref);
                                                }
                                            });
                                        }}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <Icon name="trash" className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Table Pagination */}
                    <Pagination
                        currentPage={1}
                        totalPages={100}
                        onPageChange={(page) => console.log('Page changed to:', page)}
                    />
                </div>
            </div>

            <ConfirmationModal
                {...modalProps}
            />
        </div>
    );
};
