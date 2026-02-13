import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { useConfirmationModal } from '../../../hooks/useConfirmationModal';
import { mockTrackingApi } from '../api/mockTrackingApi';
import type { ImportTransaction, LayoutContext } from '../types';
import { StatusChart } from './StatusChart';


import { Icon } from '../../../components/Icon';
import { Pagination } from '../../../components/Pagination';
import { DateTimeCard } from './shared/DateTimeCard';
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

            {/* Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Time & Date Cards - Stacked vertically */}
                <div className="flex flex-col gap-6">
                    <DateTimeCard type="time" value={dateTime.time} />
                    <DateTimeCard type="date" value={dateTime.date} />
                </div>

                {/* Status Chart */}
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
                            className="pl-10 pr-4 py-2 bg-white rounded-2xl border border-gray-200 text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 font-medium"
                        />
                        <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                    </div>
                    <div className="relative">
                        <Icon name="filter" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 z-10 pointer-events-none" />
                        <button
                            onClick={() => setOpenDropdown(openDropdown === 'filter' ? null : 'filter')}
                            className="pl-9 pr-8 py-2 text-sm rounded-2xl border border-gray-200 bg-white text-slate-500 font-bold min-w-[100px] text-left relative flex items-center justify-between focus:outline-none transition-all hover:border-gray-300"
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
                            className="pr-8 py-2 pl-3 text-sm rounded-2xl border border-gray-200 bg-white text-slate-500 font-bold min-w-[140px] text-left relative flex items-center justify-between focus:outline-none transition-all hover:border-gray-300"
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
                        className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold py-2.5 px-6 rounded-xl uppercase tracking-wider transition-colors shadow-sm ml-auto"
                    >
                        DEFAULT
                    </button>
                </div>
            </div>

            {/* Transaction List Card */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm transition-colors overflow-hidden">
                <div className="p-6">
                    {/* Table Header */}
                    <div className="grid gap-4 pb-3 border-b border-gray-100 mb-3 px-2 font-bold"
                        style={{ gridTemplateColumns: '50px 1.2fr 1.2fr 1fr 1.5fr 1fr 80px' }}>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">BLSC</span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customs Ref No.</span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bill of Lading</span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Importer</span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Arrival Date</span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</span>
                    </div>

                    {/* Table Rows */}
                    <div className="space-y-1">
                        {filteredData.map((row, i) => (
                            <div
                                key={i}
                                onClick={() => navigate(`/tracking/${row.ref}`)}
                                className="grid gap-4 py-2 items-center cursor-pointer rounded-xl transition-all duration-200 px-2 hover:bg-gray-50 hover:shadow-sm"
                                style={{ gridTemplateColumns: '50px 1.2fr 1.2fr 1fr 1.5fr 1fr 80px' }}
                            >
                                <span className={`w-2.5 h-2.5 rounded-full ${row.color}`}></span>
                                <p className="text-sm text-gray-900 font-bold">{row.ref}</p>
                                <p className="text-sm text-slate-500 font-bold">{row.bl}</p>
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
                                <p className="text-sm text-slate-500 font-bold">{row.importer}</p>
                                <p className="text-sm text-slate-500 font-bold">{row.date}</p>
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
