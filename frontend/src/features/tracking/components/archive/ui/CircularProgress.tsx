export const CircularProgress = ({ pct }: { pct: number }) => {
    const r = 44;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    const color = pct >= 90 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
    return (
        <div className="relative w-24 h-24 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx={50} cy={50} r={r} stroke="#e5e7eb" strokeWidth={8} fill="none" />
                <circle cx={50} cy={50} r={r} stroke={color} strokeWidth={8} fill="none"
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                    className="transition-all duration-700 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-gray-800 tabular-nums leading-none">{pct}%</span>
                <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">Complete</span>
            </div>
        </div>
    );
};
