import type { DocumentStat } from './documentsList.utils';
import { TABLE_GRID } from './documentsList.utils';

export const StatIcon = ({ d, color }: { d: string; color: string }) => (
    <svg className="h-4 w-4" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
);

export const DocumentsStats = ({
    stats,
    isLoading,
}: {
    stats: DocumentStat[];
    isLoading: boolean;
}) => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-3xl font-bold tabular-nums text-text-primary">
                            {isLoading ? (
                                <span className="inline-block h-8 w-16 animate-pulse rounded bg-surface-secondary" />
                            ) : (
                                stat.value
                            )}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-text-secondary">{stat.label}</p>
                        <div className="mt-0.5 flex h-4 items-center text-xs text-text-muted">
                            {isLoading ? (
                                <span className="inline-block h-3 w-24 animate-pulse rounded bg-surface-secondary" />
                            ) : (
                                stat.sub
                            )}
                        </div>
                    </div>
                    <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${stat.color}20` }}
                    >
                        <StatIcon d={stat.icon} color={stat.color} />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export const TableSkeleton = () => (
    <div className="divide-y divide-border/50">
        {Array.from({ length: 6 }).map((_, index) => (
            <div
                key={index}
                className="grid items-center gap-4 px-6 py-3.5"
                style={{ gridTemplateColumns: TABLE_GRID }}
            >
                <div className="h-6 w-16 animate-pulse rounded-full bg-surface-secondary" />
                <div className="h-4 w-28 animate-pulse rounded bg-surface-secondary" />
                <div className="h-4 w-36 animate-pulse rounded bg-surface-secondary" />
                <div className="h-4 w-20 animate-pulse rounded bg-surface-secondary" />
                <div className="flex justify-center">
                    <div className="h-6 w-20 animate-pulse rounded-full bg-surface-secondary" />
                </div>
                <div className="flex justify-center">
                    <div className="h-6 w-16 animate-pulse rounded-full bg-surface-secondary" />
                </div>
            </div>
        ))}
    </div>
);
