import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { appRoutes } from '../../../lib/appRoutes';
import { useAuth } from '../../auth';
import { CurrentDateTime } from '../../../components/CurrentDateTime';

export const RecordsLayout = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Guard: Only admins (or potentially encoders if authorized) can access records
    const canAccess = user?.role === 'admin' || user?.role === 'encoder';
    if (!canAccess) {
        return <Navigate to={appRoutes.tracking} replace />;
    }

    const currentPath = location.pathname;
    const isLegacy = currentPath.includes(appRoutes.recordsLegacy);
    const isArchive = currentPath.includes(appRoutes.recordsArchives);
    
    // Default redirect to legacy upload if just on /records
    if (currentPath === appRoutes.records || currentPath === appRoutes.records + '/') {
        return <Navigate to={appRoutes.recordsLegacy} replace />;
    }

    const tabs = [
        {
            id: 'legacy',
            label: 'Legacy Folder Upload',
            path: appRoutes.recordsLegacy,
            icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
            active: isLegacy
        },
        {
            id: 'archives',
            label: 'Archive Transactions',
            path: appRoutes.recordsArchives,
            icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
            active: isArchive
        }
    ];

    return (
        <div className="w-full flex-1 flex flex-col p-8 pb-12 overflow-y-auto bg-[#F9FAFB] dark:bg-[#111111] transition-colors">
            {/* Page Header */}
            <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Records
                    </h1>
                    <p className="text-[15px] font-medium text-gray-500 dark:text-gray-400 mt-2 max-w-3xl leading-relaxed">
                        Manage normalized archive transactions and upload historical legacy folders for reference.
                    </p>
                </div>
                <CurrentDateTime
                    className="text-right shrink-0"
                    timeClassName="text-2xl font-bold tabular-nums text-gray-900 dark:text-white"
                    dateClassName="text-sm text-gray-500 dark:text-gray-400"
                />
            </div>

            {/* Sub-navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1 mb-8 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => navigate(tab.path)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                            tab.active
                                ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-white/10'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                        </svg>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Sub-view Content */}
            <div className="flex-1 min-h-0 flex flex-col">
                <Outlet />
            </div>
        </div>
    );
};
