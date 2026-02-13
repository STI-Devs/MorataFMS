import { useTheme } from '../../../context/ThemeContext';

interface StatusChartProps {
    data: { label: string; value: number; color: string }[];
}

export const StatusChart = ({ data }: StatusChartProps) => {
    const { theme } = useTheme();
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const sortedData = [...data].sort((a, b) => b.value - a.value);

    // Calculate chart dimensions
    const size = 150;
    const center = size / 2;
    const baseRadius = 65;
    const strokeWidth = 10;
    const spacing = 4;

    return (
        <div className={`rounded-[2rem] p-6 shadow-sm border h-full flex flex-col ${theme === 'dark'
            ? 'bg-gray-800 border-black'
            : 'bg-white border-white'
            }`}>
            <h3 className={`text-sm font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Status Overview</h3>
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8 flex-1">
                {/* Activity Rings Chart */}
                <div className="relative w-36 h-36 flex-shrink-0">
                    <svg
                        width={size}
                        height={size}
                        viewBox={`0 0 ${size} ${size}`}
                        className="transform -rotate-90 w-full h-full"
                    >
                        {sortedData.map((item, i) => {
                            const radius = baseRadius - (i * (strokeWidth + spacing));
                            const circumference = 2 * Math.PI * radius;
                            const percentage = (item.value / total) * 100;
                            const offset = circumference - (percentage / 100) * circumference;

                            return (
                                <g key={i}>
                                    {/* Track (Background) */}
                                    <circle
                                        cx={center}
                                        cy={center}
                                        r={radius}
                                        fill="transparent"
                                        stroke={item.color}
                                        strokeWidth={strokeWidth}
                                        className="opacity-10"
                                    />
                                    {/* Progress Ring */}
                                    <circle
                                        cx={center}
                                        cy={center}
                                        r={radius}
                                        fill="transparent"
                                        stroke={item.color}
                                        strokeWidth={strokeWidth}
                                        strokeDasharray={circumference}
                                        strokeDashoffset={offset}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* Pill Legend */}
                <div className="flex-1 grid grid-cols-1 gap-y-2 w-full min-w-0">
                    {sortedData.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div
                                className="w-6 h-2 rounded-full flex-shrink-0 shadow-sm"
                                style={{ backgroundColor: item.color }}
                            ></div>
                            <div className="min-w-0">
                                <p className={`font-bold text-xs truncate uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    }`}>{item.label}</p>
                                <p className={`font-semibold text-[10px] ${theme === 'dark' ? 'text-gray-400' : 'text-slate-400'
                                    }`}>{item.value} {item.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
