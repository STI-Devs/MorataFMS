import { Skeleton } from '../../../components/ui/skeleton';

export const DashboardSkeleton = () => (
    <div className="space-y-6">
        <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[280px] rounded-xl" />
            ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-12">
            <Skeleton className="h-64 rounded-xl xl:col-span-7" />
            <Skeleton className="h-64 rounded-xl xl:col-span-5" />
        </div>
    </div>
);
