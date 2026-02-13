interface DateTimeCardProps {
    type: 'time' | 'date';
    value: string;
    subtext?: string;
}

export const DateTimeCard = ({ type, value, subtext = 'Manila, Philippines' }: DateTimeCardProps) => {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-sky-50 dark:to-blue-100 rounded-[2rem] p-6 border border-blue-100 dark:border-blue-200 flex-1 shadow-sm transition-colors">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-white/50 rounded-xl">
                    {type === 'time' ? (
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    )}
                </div>
                <span className="text-sm font-medium text-gray-600">
                    {type === 'time' ? 'Current Time' : "Today's Date"}
                </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
            <p className="text-sm text-gray-600">{subtext}</p>
        </div>
    );
};
