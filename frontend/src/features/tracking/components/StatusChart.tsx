interface StatusChartProps {
    data: { label: string; value: number; color: string }[];
}

const SIZE        = 150;
const CENTER      = SIZE / 2;
const BASE_RADIUS = 65;
const STROKE_W    = 10;
const SPACING     = 4;

export const StatusChart = ({ data }: StatusChartProps) => {
    const total      = data.reduce((sum, item) => sum + item.value, 0);
    const sortedData = [...data].sort((a, b) => b.value - a.value);

    return (
        <div className="bg-surface rounded-[2rem] p-6 shadow-sm border border-border h-full flex flex-col transition-all duration-300 ease-in-out">
            <h3 className="text-sm font-bold text-text-primary mb-6">Status Overview</h3>
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8 flex-1">

                {/* Concentric activity-ring chart */}
                <div className="relative w-36 h-36 flex-shrink-0">
                    <svg
                        width={SIZE}
                        height={SIZE}
                        viewBox={`0 0 ${SIZE} ${SIZE}`}
                        className="transform -rotate-90 w-full h-full"
                    >
                        {sortedData.map((item, i) => {
                            const radius        = BASE_RADIUS - i * (STROKE_W + SPACING);
                            const circumference = 2 * Math.PI * radius;
                            const pct           = total > 0 ? (item.value / total) * 100 : 0;
                            const offset        = circumference - (pct / 100) * circumference;

                            return (
                                <g key={i}>
                                    {/* Track */}
                                    <circle
                                        cx={CENTER} cy={CENTER} r={radius}
                                        fill="transparent"
                                        stroke={item.color}
                                        strokeWidth={STROKE_W}
                                        className="opacity-10"
                                    />
                                    {/* Progress */}
                                    <circle
                                        cx={CENTER} cy={CENTER} r={radius}
                                        fill="transparent"
                                        stroke={item.color}
                                        strokeWidth={STROKE_W}
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

                {/* Pill legend */}
                <div className="flex-1 grid grid-cols-1 gap-y-2 w-full min-w-0">
                    {sortedData.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div
                                className="w-6 h-2 rounded-full flex-shrink-0 shadow-sm"
                                style={{ backgroundColor: item.color }}
                            />
                            <div className="min-w-0">
                                <p className="text-text-primary font-bold text-xs truncate uppercase tracking-tight">{item.label}</p>
                                <p className="text-text-muted font-semibold text-[10px]">{item.value} {item.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
