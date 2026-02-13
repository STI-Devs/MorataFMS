
interface PageHeaderProps {
    title: string;
    breadcrumb: string;
    user: { name: string } | null;
}

export const PageHeader = ({ title, breadcrumb, user }: PageHeaderProps) => {
    return (
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-900 font-bold">{breadcrumb}</p>
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </button>
                <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{user?.name || 'FirstN LastN'}</p>
                    <p className="text-xs text-gray-500">Document In Charge</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#1a2332] flex items-center justify-center text-white font-semibold border-2 border-white shadow-md">
                    {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('') : 'FL'}
                </div>
            </div>
        </div>
    );
};
