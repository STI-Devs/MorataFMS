import { Card, CardContent } from '../../../../components/ui/card';
import { Skeleton } from '../../../../components/ui/skeleton';
import type { DocumentStat } from './documentsList.utils';

const StatIcon = ({ d, color }: { d: string; color: string }) => (
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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
            <Card key={stat.label}>
                <CardContent className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                        {isLoading ? (
                            <>
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="mt-2 h-3 w-24" />
                            </>
                        ) : (
                            <>
                                <p className="text-3xl font-bold tabular-nums text-foreground">{stat.value}</p>
                                <p className="mt-1 text-xs font-semibold text-muted-foreground">{stat.label}</p>
                                <p className="mt-0.5 truncate text-xs text-muted-foreground/70">{stat.sub}</p>
                            </>
                        )}
                    </div>
                    <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `color-mix(in srgb, ${stat.color} 12%, transparent)` }}
                    >
                        <StatIcon d={stat.icon} color={stat.color} />
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
);
