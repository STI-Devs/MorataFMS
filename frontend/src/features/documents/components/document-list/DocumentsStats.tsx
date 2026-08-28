import { AlertCircle, FileCheck, Flag, Ship } from 'lucide-react';
import { Card, CardContent } from '../../../../components/ui/card';
import { Skeleton } from '../../../../components/ui/skeleton';
import type { DocumentStat } from './documentsList.utils';

function getStatIcon(label: string) {
    switch (label.toLowerCase()) {
        case 'completed transactions':
        case 'total completed':
            return <FileCheck className="size-3.5 text-primary" />;
        case 'import cleared':
        case 'import records':
            return <Ship className="size-3.5 text-info" />;
        case 'export shipped':
        case 'export records':
            return <Flag className="size-3.5 text-success" />;
        case 'pending docs':
            return <AlertCircle className="size-3.5 text-amber-500" />;
        default:
            return <FileCheck className="size-3.5 text-muted-foreground" />;
    }
}

export const DocumentsStats = ({
    stats,
    isLoading,
}: {
    stats: DocumentStat[];
    isLoading: boolean;
}) => (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
            <Card key={stat.label} className="shadow-2xs">
                <CardContent className="p-2.5 sm:p-3 space-y-0.5">
                    <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <span>{stat.label}</span>
                        {getStatIcon(stat.label)}
                    </div>
                    {isLoading ? (
                        <>
                            <Skeleton className="h-6 w-14" />
                            <Skeleton className="h-2.5 w-20" />
                        </>
                    ) : (
                        <>
                            <div className="text-lg sm:text-xl font-bold tabular-nums text-foreground leading-tight">
                                {stat.value}
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate leading-none">
                                {stat.sub}
                            </p>
                        </>
                    )}
                </CardContent>
            </Card>
        ))}
    </div>
);
