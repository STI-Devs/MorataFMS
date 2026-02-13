import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Icon } from '../../../components/Icon';
import { mockTrackingApi } from '../api/mockTrackingApi';
import type { ExportTransaction, ImportTransaction, LayoutContext } from '../types';
import { DateTimeCard } from './shared/DateTimeCard';
import { PageHeader } from './shared/PageHeader';

type Transaction = ImportTransaction | ExportTransaction;

export const TrackingDashboard = () => {
    const navigate = useNavigate();
    const { user, dateTime } = useOutletContext<LayoutContext>();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await mockTrackingApi.getAllTransactions();
                // Sort by date (assuming strings, but would verify format in real app)
                setTransactions(data);
            } catch (err) {
                console.error("Failed to load transactions", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter logic
    const filteredData = transactions.filter(t => 
        t.ref.toLowerCase().includes(filter.toLowerCase()) ||
        t.bl.toLowerCase().includes(filter.toLowerCase())
    );

    // KPI Calculations
    const totalActive = transactions.filter(t => t.status !== 'Cleared' && t.status !== 'Shipped').length;
    const totalImports = transactions.filter(t => 'importer' in t).length;
    const totalExports = transactions.filter(t => 'shipper' in t).length;

    const isImport = (t: Transaction): t is ImportTransaction => 'importer' in t;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Tracking Dashboard"
                breadcrumb="Dashboard / Tracking"
                user={user || null}
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-bold uppercase">Active Shipments</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{totalActive}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                        <Icon name="truck" className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-bold uppercase">Total Imports</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{totalImports}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-xl text-green-600">
                        <Icon name="download" className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-bold uppercase">Total Exports</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{totalExports}</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
                        <Icon name="credit-card" className="w-6 h-6" /> 
                        {/* Using credit-card as placeholder for export icon if 'upload' not available, or use arrow-up */}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Left: Recent Activity / List */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-900">All Shipments</h2>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search ref or BL..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
                            />
                            <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                        <th className="pb-3 pl-2">Type</th>
                                        <th className="pb-3">Reference</th>
                                        <th className="pb-3">Status</th>
                                        <th className="pb-3 text-right pr-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredData.map((t, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/tracking/${t.ref}`)}>
                                            <td className="py-3 pl-2">
                                                {isImport(t) ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-bold">
                                                        <Icon name="download" className="w-3.5 h-3.5" /> Import
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                                                        <Icon name="truck" className="w-3.5 h-3.5" /> Export
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 font-bold text-gray-900 text-sm">
                                                {t.ref}
                                                <div className="text-xs text-gray-400 font-normal">{t.bl}</div>
                                            </td>
                                            <td className="py-3">
                                                 <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide text-white ${
                                                     t.status === 'Cleared' || t.status === 'Shipped' ? 'bg-green-500' :
                                                     t.status === 'Pending' || t.status === 'Processing' ? 'bg-yellow-500' :
                                                     t.status === 'Delayed' ? 'bg-red-500' : 'bg-blue-500'
                                                 }`}>
                                                     {t.status}
                                                 </span>
                                            </td>
                                            <td className="py-3 text-right pr-2">
                                                <button className="text-gray-400 hover:text-blue-600">
                                                    <Icon name="chevron-right" className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredData.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">No shipments found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Right: Info / Calendar */}
                <div className="flex flex-col gap-6">
                     <DateTimeCard type="time" value={dateTime.time} />
                     <DateTimeCard type="date" value={dateTime.date} />
                     
                     <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-6 text-white shadow-lg">
                        <h3 className="font-bold text-lg mb-2">System Status</h3>
                        <p className="text-blue-100 text-sm mb-4">All systems operational. No delays reported in customs processing today.</p>
                        <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-colors">
                            View Reports
                        </button>
                     </div>
                </div>
            </div>
        </div>
    );
};
