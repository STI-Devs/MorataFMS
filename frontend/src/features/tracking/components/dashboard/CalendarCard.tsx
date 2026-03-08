import { useEffect, useState } from 'react';

interface CalendarCardProps {
    className?: string;
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

export const CalendarCard = ({ className = '' }: CalendarCardProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Update date every minute to handle midnight crossover
    useEffect(() => {
        const timer = setInterval(() => setCurrentDate(new Date()), 60_000);
        return () => clearInterval(timer);
    }, []);

    const year       = currentDate.getFullYear();
    const month      = currentDate.getMonth();
    const today      = currentDate.getDate();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay   = new Date(year, month, 1).getDay();

    const days: (number | null)[] = [
        ...Array.from({ length: firstDay }, () => null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    return (
        <div className={`bg-surface rounded-[2rem] p-5 border border-border shadow-sm h-full flex flex-col transition-all duration-300 ease-in-out ${className}`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-text-primary">
                    {MONTH_NAMES[month]}, {year}
                </h3>
                <div className="flex items-center text-xs text-text-secondary font-medium cursor-pointer hover:text-text-primary">
                    Today
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Day-of-week labels */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-text-muted mb-1">
                {['Sun', 'Mon', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d}>{d}</div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1 text-sm font-medium text-text-secondary flex-1 content-start">
                {days.map((day, i) => (
                    <div key={i} className="aspect-square flex items-center justify-center">
                        {day ? (
                            <span
                                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                                    day === today
                                        ? 'bg-[#c41e3a] text-white font-bold shadow-md'
                                        : 'hover:bg-hover cursor-pointer'
                                }`}
                            >
                                {day}
                            </span>
                        ) : (
                            <span className="text-text-muted opacity-50" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
