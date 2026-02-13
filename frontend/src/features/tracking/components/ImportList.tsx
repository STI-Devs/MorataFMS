import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { EncodeModal } from './EncodeModal';
import { StatusChart } from './StatusChart';
import { Calendar } from './Calendar';
import { useTheme } from '../../../context/ThemeContext';


interface LayoutContext {
    user?: { name: string; role: string };
    dateTime: { time: string; date: string };
}

export const ImportList = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [filterType, setFilterType] = useState<string>('');
    const [filterValue, setFilterValue] = useState<string>('');
    const [openDropdown, setOpenDropdown] = useState<'filter' | 'colour' | null>(null);
    const [isEncodeModalOpen, setIsEncodeModalOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText?: string;
        confirmButtonClass?: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const handleReset = () => {
        setFilterType('');
        setFilterValue('');
        setOpenDropdown(null);
    };
    const { user, dateTime } = useOutletContext<LayoutContext>();

    const data = [
        { ref: 'REF-2024-001', bl: 'BL-78542136', status: 'Cleared', color: 'bg-green-500', importer: 'ABC Trading Co.', date: 'Jan 15, 2024' },
        { ref: 'REF-2024-002', bl: 'BL-78542137', status: 'Pending', color: 'bg-yellow-500', importer: 'XYZ Imports Ltd.', date: 'Feb 20, 2024' },
        { ref: 'REF-2024-003', bl: 'BL-78542138', status: 'Delayed', color: 'bg-red-500', importer: 'Global Freight Inc.', date: 'Mar 10, 2024' },
        { ref: 'REF-2024-004', bl: 'BL-78542139', status: 'Cleared', color: 'bg-green-500', importer: 'Metro Supplies', date: 'Apr 05, 2024' },
        { ref: 'REF-2024-005', bl: 'BL-78542140', status: 'In Transit', color: 'bg-blue-500', importer: 'Prime Logistics', date: 'May 18, 2024' },
    ];

    // Calculate status counts for chart
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



    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className={`text - 2xl font - bold transition - colors duration - 300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                        } `}>Import Transactions</h1>
                    <p className={`text - sm font - bold transition - colors duration - 300 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-900'
                        } `}>Dashboard / Import Transactions</p>
                </div>

                <div className="flex items-center gap-4">
                    <button className={`p - 2 rounded - lg border transition - colors duration - 300 ${theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                        } `}>
                        <svg className={`w - 5 h - 5 transition - colors duration - 300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            } `} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </button>
                    <div className="text-right">
                        <p className={`text - sm font - semibold transition - colors duration - 300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                            } `}>{user?.name || 'FirstN LastN'}</p>
                        <p className={`text - xs transition - colors duration - 300 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            } `}>Document In Charge</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-semibold border-2 border-white shadow-md">
                        {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('') : 'FL'}
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                {/* Time Card */}
                <div className={`rounded-[2rem] p-8 border shadow-sm ${theme === 'light'
                    ? 'bg-white border-gray-200'
                    : theme === 'dark'
                        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-black'
                        : 'bg-white border-gray-200'
                    }`}>
                    <div className="flex flex-col items-center justify-center h-full">
                        <p className={`text-5xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{dateTime.time}</p>
                        <p className={`text-sm font-medium mb-4 ${theme === 'dark'
                            ? 'text-gray-400'
                            : 'text-gray-500'
                            }`}>{dateTime.date}</p>
                        <div className="flex items-center justify-center gap-2">
                            <svg className={`w-4 h-4 ${theme === 'dark'
                                ? 'text-red-400'
                                : 'text-red-500'
                                }`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <p className={`text-sm ${theme === 'dark'
                                ? 'text-gray-400'
                                : 'text-gray-500'
                                }`}>Manila, Philippines</p>
                        </div>
                    </div>
                </div>

                {/* Calendar */}
                <Calendar currentDate={new Date()} />

                {/* Status Chart */}
                <StatusChart data={chartData} />
            </div>

            {/* Controls Bar Above the List Card */}
            <div className="flex justify-end items-center mb-6 px-2">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search anything"
                            className={`pl-10 pr-4 py-2 rounded-2xl border text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium transition-colors duration-300 ${theme === 'dark'
                                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                                }`}
                        />
                        <svg className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <div className="relative">
                        <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 z-10 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        <button
                            onClick={() => setOpenDropdown(openDropdown === 'filter' ? null : 'filter')}
                            className={`pl-9 pr-8 py-2 text-sm rounded-2xl border font-bold min-w-[100px] text-left relative flex items-center justify-between focus:outline-none transition-all ${theme === 'dark'
                                ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                                : 'bg-white border-gray-200 text-slate-500 hover:border-gray-300'
                                }`}
                        >
                            {filterType || 'Filter'}
                            <svg className={`w-3.5 h-3.5 ml-2 absolute right-2 transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
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
                            className={`pl-9 pr-8 py-2 text-sm rounded-2xl border font-bold min-w-[100px] text-left relative flex items-center justify-between focus:outline-none transition-all ${theme === 'dark'
                                ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                                : 'bg-white border-gray-200 text-slate-500 hover:border-gray-300'
                                }`}
                        >
                            {filterValue || 'Colour'}
                            <svg className={`w-3.5 h-3.5 ml-2 absolute right-2 transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
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

                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            onClick={handleReset}
                            className={`text-xs font-bold py-2.5 px-6 rounded-xl uppercase tracking-wider transition-all shadow-sm border ${theme === 'dark'
                                ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                                : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300'
                                }`}
                        >
                            DEFAULT
                        </button>
                        <button
                            onClick={() => setIsEncodeModalOpen(true)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-all border ${theme === 'dark'
                                ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                                : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300'
                                }`}
                            title="Encode new transaction"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v12m6-6H6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Transaction List Card */}
            <div className={`rounded-[2rem] border shadow-sm transition-all duration-300 overflow-hidden ${theme === 'dark'
                ? 'bg-gray-800 border-black'
                : 'bg-white border-white'
                }`}>
                <div className="p-6">
                    {/* Table Header */}
                    <div className={`grid gap-4 pb-3 mb-3 px-2 font-bold border-b transition-colors duration-300 ${theme === 'dark' ? 'border-black' : 'border-white'
                        }`}
                        style={{ gridTemplateColumns: '50px 1.2fr 1.2fr 1fr 1.5fr 1fr 80px' }}>
                        <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                            }`}>BLSC</span>
                        <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                            }`}>Customs Ref No.</span>
                        <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                            }`}>Bill of Lading</span>
                        <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                            }`}>Status</span>
                        <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                            }`}>Importer</span>
                        <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                            }`}>Arrival Date</span>
                        <span className={`text-xs font-bold uppercase tracking-wider text-right transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                            }`}>Actions</span>
                    </div>

                    {/* Table Rows */}
                    <div className="space-y-1">
                        {data.map((row, i) => (
                            <div
                                key={i}
                                onClick={() => navigate('/tracking/REF-2024-001')}
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
                                            setConfirmModal({
                                                isOpen: true,
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
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setConfirmModal({
                                                isOpen: true,
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
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Table Pagination */}
                    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-6 px-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-900 font-bold">Show</span>
                            <select className="bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1 px-2 outline-none cursor-pointer font-bold">
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="25">25</option>
                            </select>
                            <span className="text-sm text-gray-900 font-bold">of 100 pages</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="flex items-center gap-1">
                                <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-black text-white text-sm font-bold">1</button>
                                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-900 text-sm font-bold transition-colors">2</button>
                                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-900 text-sm font-bold transition-colors">3</button>
                                <span className="text-gray-900 px-1 font-bold">...</span>
                                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-900 text-sm font-bold transition-colors">16</button>
                            </div>
                            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                confirmButtonClass={confirmModal.confirmButtonClass}
            />

            <EncodeModal
                isOpen={isEncodeModalOpen}
                onClose={() => setIsEncodeModalOpen(false)}
                type="import"
                onSave={(data) => {
                    console.log('Encoded Import:', data);
                    // Here you would typically send data to your backend
                }}
            />
        </div>
    );
};
