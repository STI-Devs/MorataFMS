import { Badge } from '../../../components/ui/badge';

export const DashboardHeader = () => (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
                Overview of active brokerage operations and metrics.
            </p>
        </div>
        <Badge variant="outline" className="w-fit gap-1.5 py-1 text-xs">
            <span className="size-2 rounded-full bg-success animate-pulse" />
            Live Operations
        </Badge>
    </div>
);
