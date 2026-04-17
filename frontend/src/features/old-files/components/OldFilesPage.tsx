import { useTheme } from '../../../context/ThemeContext';

export const OldFilesPage = () => {
    const { theme } = useTheme();
    const isContentDark = theme === 'dark';

    return (
        <div className="flex flex-col flex-1 h-full">
            <div className="mb-6">
                <h1 className={`text-2xl font-bold ${isContentDark ? 'text-white' : 'text-gray-900'}`}>
                    Old Files
                </h1>
                <p className={`text-sm mt-1 ${isContentDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Access and manage archived old files.
                </p>
            </div>

            <div className={`flex-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed ${isContentDark ? 'border-white/10 bg-white/2' : 'border-gray-200 bg-gray-50'}`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isContentDark ? 'bg-white/8' : 'bg-gray-100'}`}>
                    <svg className={`w-8 h-8 ${isContentDark ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                </div>
                <p className={`text-sm font-semibold ${isContentDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    No old files yet
                </p>
                <p className={`text-xs mt-1 ${isContentDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Old files will appear here once available.
                </p>
            </div>
        </div>
    );
};
