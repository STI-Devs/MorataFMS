export const CircularProgress = ({ pct }: { pct: number }) => {
    const r = 44;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    const color = pct >= 90 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
    return (
        <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background ring — uses currentColor so it respects theme */}
                <circle cx={50} cy={50} r={r} stroke="currentColor" strokeWidth={8} fill="none"
                    className="text-border" />
                <circle cx={50} cy={50} r={r} stroke={color} strokeWidth={8} fill="none"
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                    className="transition-all duration-700 ease-out" />
            </svg>
            <div className="relative z-10 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-text-primary tabular-nums leading-none tracking-tight">{pct}%</span>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Complete</span>
            </div>
        </div>
    );
};
