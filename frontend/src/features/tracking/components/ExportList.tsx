import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { EncodeModal } from './EncodeModal';
import { Calendar } from './Calendar';
import { useTheme } from '../../../context/ThemeContext';
import { StatusChart } from './StatusChart';



interface LayoutContext {
    user?: { name: string; role: string };
    dateTime: { time: string; date: string };
}

export const ExportList = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
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

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const totalPages = 2; // Mock total pages for demonstration
    const goToPage = (page: number) => setCurrentPage(page);
    const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

    const { user, dateTime } = useOutletContext<LayoutContext>();

    const data = [
        { ref: 'REF-EXP-001', bl: 'BL-78542136', status: 'Shipped', color: 'bg-green-500', shipper: 'ABC Exports Inc.', vessel: 'MV Northern Light', departureDate: 'Nov 15, 2024', portOfDestination: 'Singapore' },
        { ref: 'REF-EXP-002', bl: 'BL-78542137', status: 'Processing', color: 'bg-yellow-500', shipper: 'Global Trade Ltd.', vessel: 'Evergreen Star', departureDate: 'Nov 18, 2024', portOfDestination: 'Tokyo' },
        { ref: 'REF-EXP-003', bl: 'BL-78542138', status: 'Delayed', color: 'bg-red-500', shipper: 'Fast Cargo Co.', vessel: 'Pacific Voyager', departureDate: 'Nov 20, 2024', portOfDestination: 'Shanghai' },
        { ref: 'REF-EXP-004', bl: 'BL-78542139', status: 'Shipped', color: 'bg-green-500', shipper: 'Metro Supplies', vessel: 'MSC Oscar', departureDate: 'Nov 22, 2024', portOfDestination: 'Busan' },
        { ref: 'REF-EXP-005', bl: 'BL-78542140', status: 'In Transit', color: 'bg-blue-500', shipper: 'Prime Logistics', vessel: 'Hapag-Lloyd', departureDate: 'Nov 25, 2024', portOfDestination: 'Hong Kong' },
    ];

    // Calculate status counts for chart
    const statusCounts = data.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const chartData = [
        { label: 'Shipped', value: statusCounts['Shipped'] || 0, color: '#4cd964' },
        { label: 'Processing', value: statusCounts['Processing'] || 0, color: '#ffcc00' },
        { label: 'Delayed', value: statusCounts['Delayed'] || 0, color: '#ff2d55' },
        { label: 'In Transit', value: statusCounts['In Transit'] || 0, color: '#00d2ff' },
    ];





    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className={`text-2xl font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Export Transactions</h1>
                    <p className={`text-sm font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-900'
                        }`}>Dashboard / Export Transactions</p>
                </div>

                <div className="flex items-center gap-4">
                    <button className={`p-2 rounded-lg border transition-colors duration-300 ${theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}>
                        <svg className={`w-5 h-5 transition-colors duration-300 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </button>
                    <div className="text-right">
                        <p className={`text-sm font-semibold transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{user?.name || 'FirstN LastN'}</p>
                        <p className={`text-xs transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>Document In Charge</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-semibold border-2 border-white shadow-md">
                        {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('') : 'FL'}
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                {/* Time Card */}
                <div className={`rounded-[2rem] p-8 border shadow-sm transition-all duration-300 ${theme === 'light'
                    ? 'bg-white border-gray-200'
                    : theme === 'dark'
                        ? 'bg-gray-800 border-black'
                        : 'bg-white border-gray-200'
                    }`}>
                    <div className="flex flex-col items-center justify-center h-full">
                        <p className={`text-5xl font-bold mb-3 transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{dateTime.time}</p>
                        <p className={`text-sm font-medium mb-4 transition-colors duration-300 ${theme === 'light'
                            ? 'text-gray-600'
                            : theme === 'dark'
                                ? 'text-gray-400'
                                : 'text-gray-600'
                            }`}>{dateTime.date}</p>
                        <div className="flex items-center justify-center gap-2">
                            <svg className={`w-4 h-4 transition-colors duration-300 ${theme === 'light'
                                ? 'text-red-500'
                                : theme === 'dark'
                                    ? 'text-red-400'
                                    : 'text-red-500'
                                }`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <p className={`text-sm transition-colors duration-300 ${theme === 'light'
                                ? 'text-gray-600'
                                : theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
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

                    <div className="flex items-center gap-2 ml-auto">
                        <button
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
                        style={{ gridTemplateColumns: '1.4fr 1.4fr 1.5fr 1.4fr 1.5fr 100px' }}>
                        <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                            }`}>Shipper</span>
                        <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                            }`}>Bill of Lading</span>
                        <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                            }`}>Vessel</span>
                        <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                            }`}>Departure Date</span>
                        <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                            }`}>Port of Destination</span>
                        <span className={`text-xs font-bold uppercase tracking-wider text-right transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                            }`}>Actions</span>
                    </div>

                    {/* Table Rows */}
                    <div className="space-y-1">
                        {data.map((row, i) => (
                            <div
                                key={i}
                                onClick={() => navigate(`/tracking/${row.ref}`)}
                                className={`grid gap-4 py-2 items-center cursor-pointer rounded-xl transition-all duration-200 px-2 hover:shadow-sm ${theme === 'dark'
                                    ? 'hover:bg-gray-700/50'
                                    : 'hover:bg-gray-50'
                                    }`}
                                style={{ gridTemplateColumns: '1.4fr 1.4fr 1.5fr 1.4fr 1.5fr 100px' }}
                            >
                                <p className={`text-sm font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                                    }`}>{row.shipper}</p>
                                <p className={`text-sm font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                                    }`}>{row.bl}</p>
                                <p className={`text-sm font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                                    }`}>{row.vessel}</p>
                                <p className={`text-sm font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    }`}>{row.departureDate}</p>
                                <p className={`text-sm font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'
                                    }`}>{row.portOfDestination}</p>
                                <div className="flex justify-end gap-2 px-1">
                                    <button
                                        className={`p-1.5 rounded-lg transition-colors ${theme === 'dark'
                                            ? 'text-blue-400 hover:bg-gray-700 hover:text-blue-300'
                                            : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                                            }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setConfirmModal({
                                                isOpen: true,
                                                title: 'Edit Export',
                                                message: 'Are you sure you want to edit this export transaction?',
                                                confirmText: 'Confirm Edit',
                                                confirmButtonClass: 'bg-gray-900 hover:bg-black',
                                                onConfirm: () => {
                                                    navigate(`/tracking/${row.ref}`);
                                                }
                                            });
                                        }}
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
                                                title: 'Delete Export',
                                                message: 'Are you sure you want to delete this export transaction? This action cannot be undone.',
                                                onConfirm: () => {
                                                    /* Delete logic */
                                                    console.log('Deleted export', row.ref);
                                                }
                                            });
                                        }}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Table Pagination */}
                {/* Table Pagination */}
                <div className={`px-6 py-4 border-t flex items-center justify-between ${theme === 'dark' ? 'border-black' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-2 text-sm">
                        <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Show</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className={`px-2 py-1 rounded text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${theme === 'dark'
                                ? 'bg-gray-700 border border-gray-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-900'
                                }`}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                        </select>
                        <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>of {totalPages} pages</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={goToPrevPage}
                            disabled={currentPage === 1}
                            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${theme === 'dark'
                                ? 'text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50'
                                : 'text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => goToPage(page)}
                                className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded transition-colors ${currentPage === page
                                    ? (theme === 'dark' ? 'bg-gray-200 text-black' : 'bg-gray-800 text-white')
                                    : (theme === 'dark' ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-gray-100 hover:bg-gray-200')
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${theme === 'dark'
                                ? 'text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50'
                                : 'text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
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
                type="export"
                onSave={(data) => {
                    console.log('Encoded Export:', data);
                    // Here you would typically send data to your backend
                }}
            />
        </div>
    );
};
