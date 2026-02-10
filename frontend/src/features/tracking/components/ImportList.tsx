import { useNavigate, useOutletContext } from 'react-router-dom';
import { StatusChart } from './StatusChart';

interface LayoutContext {
    user?: { name: string; role: string };
    dateTime: { time: string; date: string };
}

export const ImportList = () => {
    const navigate = useNavigate();
    const { user, dateTime } = useOutletContext<LayoutContext>();

    const data = [
        { ref: 'REF-2024-001', bl: 'BL-78542136', status: 'Cleared', color: 'bg-green-500', importer: 'ABC Trading Co.', date: 'Jan 15, 2024' },
        { ref: 'REF-2024-002', bl: 'BL-78542137', status: 'Pending', color: 'bg-yellow-500', importer: 'XYZ Imports Ltd.', date: 'Feb 20, 2024' },
        { ref: 'REF-2024-003', bl: 'BL-78542138', status: 'Delayed', color: 'bg-red-500', importer: 'Global Freight Inc.', date: 'Mar 10, 2024' },
        { ref: 'REF-2024-004', bl: 'BL-78542139', status: 'Cleared', color: 'bg-green-500', importer: 'Metro Supplies', date: 'Apr 05, 2024' },
        { ref: 'REF-2024-005', bl: 'BL-78542140', status: 'In Transit', color: 'bg-blue-500', importer: 'Prime Logistics', date: 'May 18, 2024' },
    ];

    // Calculate status counts
    const statusCounts = data.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const chartData = [
        { label: 'Cleared', value: statusCounts['Cleared'] || 0, color: '#10b981' },
        { label: 'Pending', value: statusCounts['Pending'] || 0, color: '#eab308' },
        { label: 'Delayed', value: statusCounts['Delayed'] || 0, color: '#ef4444' },
        { label: 'In Transit', value: statusCounts['In Transit'] || 0, color: '#3b82f6' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Import Transactions</h1>
                    <p className="text-sm text-gray-500">Dashboard / Import Transactions</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search anything"
                            className="pl-10 pr-4 py-2 bg-white rounded-lg border border-gray-200 text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <button className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </button>
                    <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{user?.name || 'FirstN LastN'}</p>
                        <p className="text-xs text-gray-500">Document In Charge</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#2c3e50] flex items-center justify-center text-white font-semibold border-2 border-white shadow-md">
                        {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('') : 'FL'}
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Time & Date Cards - Stacked vertically */}
                <div className="flex flex-col gap-6">
                    {/* Time Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-600">Current Time</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{dateTime.time}</p>
                        <p className="text-sm text-gray-600">Manila, Philippines</p>
                    </div>

                    {/* Date Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-600">Today's Date</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{dateTime.date}</p>
                        <p className="text-sm text-gray-600">Manila, Philippines</p>
                    </div>
                </div>

                {/* Status Chart */}
                <div className="h-full">
                    <StatusChart data={chartData} />
                </div>
            </div>

            {/* Transaction List - Full Width */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Import List</h3>

                {/* Table Header */}
                <div className="grid gap-4 pb-3 border-b border-gray-200 mb-3 px-2"
                    style={{ gridTemplateColumns: '50px 1.2fr 1.2fr 1fr 1.5fr 1fr 80px' }}>
                    <span className="text-xs font-semibold text-gray-500 uppercase">BLSC</span>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Customs Ref No.</span>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Bill of Lading</span>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Status</span>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Importer</span>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Arrival Date</span>
                    <span className="text-xs font-semibold text-gray-500 uppercase text-right">Actions</span>
                </div>

                {/* Table Rows */}
                <div className="space-y-1">
                    {data.map((row, i) => (
                        <div
                            key={i}
                            onClick={() => navigate('/tracking/REF-2024-001')}
                            className="grid gap-4 py-2 items-center cursor-pointer rounded-lg transition-colors px-2 hover:bg-gray-50"
                            style={{ gridTemplateColumns: '50px 1.2fr 1.2fr 1fr 1.5fr 1fr 80px' }}
                        >
                            <span className={`w-2.5 h-2.5 rounded-full ${row.color}`}></span>
                            <p className="text-sm text-gray-900 font-medium">{row.ref}</p>
                            <p className="text-sm text-gray-600">{row.bl}</p>
                            <span className="inline-flex items-center gap-1.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${row.color}`}></span>
                                <span className={`text-sm ${row.status === 'Cleared' ? 'text-green-600' : row.status === 'Pending' ? 'text-yellow-600' : row.status === 'Delayed' ? 'text-red-600' : 'text-[#1a2332]'}`}>
                                    {row.status}
                                </span>
                            </span>
                            <p className="text-sm text-gray-600">{row.importer}</p>
                            <p className="text-sm text-gray-600">{row.date}</p>
                            <div className="flex justify-end gap-2">
                                <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" onClick={(e) => e.stopPropagation()}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button className="p-1.5 text-red-600 hover:bg-red-50 rounded" onClick={(e) => e.stopPropagation()}>
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
                        <span className="text-sm text-gray-500">Show</span>
                        <select className="bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1 px-2 outline-none cursor-pointer">
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="25">25</option>
                        </select>
                        <span className="text-sm text-gray-500">of 100 pages</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-1">
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a2332] text-white text-sm font-medium">1</button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 text-sm font-medium transition-colors">2</button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 text-sm font-medium transition-colors">3</button>
                            <span className="text-gray-400 px-1">...</span>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 text-sm font-medium transition-colors">16</button>
                        </div>
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
