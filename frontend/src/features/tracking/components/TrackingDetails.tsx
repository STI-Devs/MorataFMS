import { useNavigate, useParams } from 'react-router-dom';

export const TrackingDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const sections = [
        {
            title: 'Bureau of Customs',
            status: 'In Progress',
            statusColor: 'text-blue-600',
            icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
        },
        {
            title: 'Philippine Ports Authority',
            status: 'Completed',
            statusColor: 'text-green-600',
            icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
        },
        {
            title: 'Delivery Order',
            status: 'Pending',
            statusColor: 'text-gray-500',
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
        },
        {
            title: 'Port Charges',
            status: 'Pending',
            statusColor: 'text-gray-500',
            icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        },
        {
            title: 'Releasing',
            status: 'Pending',
            statusColor: 'text-gray-500',
            icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4'
        },
        {
            title: 'Billing of Liquidation',
            status: 'Pending',
            statusColor: 'text-gray-500',
            icon: 'M9 7h6m0 36v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z'
        }
    ];

    return (
        <div className="flex flex-col">
            {/* Header with Back Button */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-900 dark:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            Ref No: {id}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-400">Tracking Dashboard /</span>
                            <span className="text-sm text-gray-900 dark:text-white font-bold">{id}</span>
                        </div>
                    </div>
                </div>
                {/* User Profile (If needed by layout logic, otherwise MainLayout handles it) */}
                {/* For now, keeping it simple as MainLayout handles header in non-details mode, 
                    but TrackingDetails.html had its own header structure.
                    Let's adjust MainLayout to let TrackingDetails handle its own header. */}
            </div>

            {/* Status Overview Card */}
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-700 mb-8 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{id || 'REF-2024-001'}</h2>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-bold">Bill of Lading: <span className="text-gray-900 dark:text-white font-bold">BL-78542136</span></p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Cleared
                    </span>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map((section, i) => (
                    <div
                        key={i}
                        className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-700 shadow-md hover:border-blue-500 transition-colors group cursor-pointer"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={section.icon} />
                                </svg>
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white">{section.title}</h3>
                        </div>
                        <p className={`text-sm font-bold ${section.status === 'Completed' ? 'text-green-600 dark:text-green-400' : section.status === 'In Progress' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-400'}`}>{section.status}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
