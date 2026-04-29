type ArchiveMetric = {
    label: string;
    value: string;
    tone: string;
};

type Props = {
    controlTitle: string;
    healthLabel: string;
    healthTone: 'good' | 'danger';
    metrics: ArchiveMetric[];
    isLoading: boolean;
};

export const ArchiveWorkspaceControlBand = ({
    controlTitle,
    healthLabel,
    healthTone,
    metrics,
    isLoading,
}: Props) => (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-3 2xl:flex-row 2xl:items-start 2xl:justify-between">
        <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Records Control</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                <h2 className="text-base font-black tracking-tight text-text-primary">{controlTitle}</h2>
                {!isLoading && (
                    <span
                        className={`inline-flex min-h-7 items-center rounded-full border px-3 py-1 text-[10px] font-bold tracking-wide ${
                            healthTone === 'danger'
                                ? 'border-red-500/30 bg-red-500/10 text-red-500'
                                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                        }`}
                    >
                        {healthLabel}
                    </span>
                )}
            </div>
        </div>

        <div className="grid min-w-0 gap-1.5 sm:grid-cols-2 xl:grid-cols-4 2xl:w-auto">
            {metrics.map((metric) => (
                <div
                    key={metric.label}
                    className="grid h-8 min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border bg-surface-secondary/50 px-2.5"
                >
                    <p className="truncate text-[9px] font-black uppercase tracking-widest text-text-muted">{metric.label}</p>
                    {isLoading ? (
                        <div className="h-3.5 w-9 justify-self-end animate-pulse rounded bg-surface" />
                    ) : (
                        <p className={`text-right text-xs font-black tabular-nums ${metric.tone}`}>{metric.value}</p>
                    )}
                </div>
            ))}
        </div>
    </div>
);
