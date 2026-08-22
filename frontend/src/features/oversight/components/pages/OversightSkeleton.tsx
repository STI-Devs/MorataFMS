import { Card, CardContent } from '../../../../components/ui/card';
import { Skeleton } from '../../../../components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../../components/ui/table';

const ROW_WIDTHS = [
    'w-14',
    'w-28',
    'w-24',
    'w-16',
    'w-20',
    'w-14',
    'w-20',
    'w-8',
];

export const OversightSkeleton = () => {
    return (
        <div className="w-full space-y-6 pb-8 pt-1" aria-busy="true" aria-label="Loading transactions">
            {/* Header skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
            </div>

            {/* KPI Cards skeleton */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="p-5">
                        <CardContent className="p-0 space-y-3">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="size-10 rounded-xl" />
                            </div>
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-4 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Table skeleton */}
            <Card className="gap-0 overflow-hidden p-0">
                <div className="border-b border-border/80 p-4">
                    <Skeleton className="h-9 w-full max-w-md" />
                </div>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40">
                            {ROW_WIDTHS.map((width, index) => (
                                <TableHead key={index}>
                                    <Skeleton className={`h-3 ${width}`} />
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 6 }).map((_, rowIndex) => (
                            <TableRow key={rowIndex}>
                                {ROW_WIDTHS.map((width, cellIndex) => (
                                    <TableCell key={cellIndex}>
                                        <Skeleton className={`h-4 ${width}`} />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
};
