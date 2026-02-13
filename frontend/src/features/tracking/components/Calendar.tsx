import { useTheme } from '../../../context/ThemeContext';

interface CalendarProps {
    currentDate: Date;
}

export const Calendar = ({ currentDate }: CalendarProps) => {
    const { theme } = useTheme();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const daysOfWeek = ['Sun', 'Mon', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = currentDate.getDate();

    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Generate calendar grid
    const calendarDays: (number | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    return (
        <div className={`rounded-[2rem] p-6 border shadow-sm ${theme === 'dark'
            ? 'bg-gray-800 border-black'
            : 'bg-white border-gray-200'
            }`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                    {monthNames[month]}, {year}
                </h3>
                <button className={`px-3 py-1 text-sm font-medium rounded-lg ${theme === 'dark'
                    ? 'text-gray-400 hover:bg-gray-700'
                    : 'text-gray-500 hover:bg-gray-100'
                    }`}>
                    Today ▾
                </button>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 gap-2 mb-3">
                {daysOfWeek.map((day, index) => (
                    <div
                        key={index}
                        className={`text-center text-xs font-medium ${theme === 'dark'
                            ? 'text-gray-400'
                            : 'text-gray-500'
                            }`}
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => (
                    <div
                        key={index}
                        className={`aspect-square flex items-center justify-center text-sm font-medium rounded-lg ${day === null
                            ? ''
                            : day === today
                                ? 'bg-red-500 text-white font-bold shadow-md'
                                : theme === 'dark'
                                    ? 'text-gray-300 hover:bg-gray-700 cursor-pointer'
                                    : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                            }`}
                    >
                        {day}
                    </div>
                ))}
            </div>
        </div>
    );
};
