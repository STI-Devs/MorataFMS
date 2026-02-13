import { useState, useEffect } from 'react';

interface CalendarCardProps {
    className?: string;
}

export const CalendarCard = ({ className = '' }: CalendarCardProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        // Update date every minute to keep current day accurate across midnight
        const timer = setInterval(() => setCurrentDate(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-indexed
    const today = currentDate.getDate();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Get number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Get starting day of the week (0 = Sunday, 1 = Monday, etc.)
    const firstDay = new Date(year, month, 1).getDay();

    const days = [];
    // Add empty placeholders for days before the 1st
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }
    // Fill remaining slots to complete rows if needed (optional, but keeps grid consistent)
    // Here we just let the grid handle it naturally

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-[2rem] p-5 border border-gray-100 dark:border-black shadow-sm h-full flex flex-col ${className}`}>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    {monthNames[month]}, {year}
                </h3>
                <div className="flex items-center text-xs text-slate-500 dark:text-gray-400 font-medium cursor-pointer hover:text-gray-700 dark:hover:text-gray-200">
                    Today
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400 mb-1">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tu</div>
                <div>We</div>
                <div>Th</div>
                <div>Fr</div>
                <div>Sa</div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 flex-1 content-start">
                {days.map((day, index) => (
                    <div key={index} className="aspect-square flex items-center justify-center">
                        {day ? (
                            <span
                                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${day === today
                                    ? 'bg-[#c41e3a] text-white font-bold shadow-md'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
                                    }`}
                            >
                                {day}
                            </span>
                        ) : (
                            <span className="text-gray-300 dark:text-gray-600 opacity-50">{/* Placeholder for previous month days? Or just empty */}</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
