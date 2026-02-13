
interface PageHeaderProps {
    title: string;
    breadcrumb: string;
    user: { name: string } | null;
}

export const PageHeader = ({ title, breadcrumb, user }: PageHeaderProps) => {
    return (
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{title}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold transition-colors duration-300">{breadcrumb}</p>
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-sm dark:shadow-none">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </button>
                <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">{user?.name || 'FirstN LastN'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Document In Charge</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#1a2332] dark:bg-blue-600 flex items-center justify-center text-white font-semibold border-2 border-white dark:border-gray-800 shadow-md transition-all duration-300">
                    {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('') : 'FL'}
                </div>
            </div>
        </div>
    );
};
