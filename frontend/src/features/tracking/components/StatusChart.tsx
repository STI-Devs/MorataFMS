interface StatusChartProps {
    data: { label: string; value: number; color: string }[];
}

export const StatusChart = ({ data }: StatusChartProps) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -90; // Start from top

    const segments = data.map((item) => {
        const percentage = (item.value / total) * 100;
        const angle = (percentage / 100) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle = endAngle;

        // Convert angles to radians
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        // Calculate arc path
        const radius = 80;
        const innerRadius = 50;
        const cx = 100;
        const cy = 100;

        const x1 = cx + radius * Math.cos(startRad);
        const y1 = cy + radius * Math.sin(startRad);
        const x2 = cx + radius * Math.cos(endRad);
        const y2 = cy + radius * Math.sin(endRad);
        const x3 = cx + innerRadius * Math.cos(endRad);
        const y3 = cy + innerRadius * Math.sin(endRad);
        const x4 = cx + innerRadius * Math.cos(startRad);
        const y4 = cy + innerRadius * Math.sin(startRad);

        const largeArc = angle > 180 ? 1 : 0;

        const pathData = [
            `M ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
            `L ${x3} ${y3}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
            'Z'
        ].join(' ');

        return {
            path: pathData,
            color: item.color,
            label: item.label,
            value: item.value,
            percentage: percentage.toFixed(0)
        };
    });

    return (
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 h-full flex flex-col">
            <h3 className="text-sm font-semibold text-gray-900 mb-6">Status Overview</h3>
            <div className="flex items-center justify-center gap-8 flex-1">
                {/* Chart */}
                <div className="relative flex-shrink-0">
                    <svg width="240" height="240" viewBox="0 0 200 200" className="w-full h-auto">
                        {segments.map((segment, i) => (
                            <path key={i} d={segment.path} fill={segment.color} />
                        ))}
                    </svg>
                </div>

                {/* Legend */}
                <div className="flex-1 grid grid-cols-2 gap-4">
                    {segments.map((segment, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0`} style={{ backgroundColor: segment.color }}></div>
                            <div>
                                <p className="text-gray-900 font-medium text-sm">{segment.label}</p>
                                <p className="text-gray-500 text-xs">{segment.value} · {segment.percentage}%</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
