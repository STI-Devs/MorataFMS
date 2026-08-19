import { AlertCircle, CheckCircle2, CircleOff, Layers } from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '../../../../components/ui/card';
import type { AdminReviewStats } from '../../types/document.types';

interface AdminReviewKpiCardsProps {
    summary: AdminReviewStats | undefined;
    total: number | undefined;
    isLoading: boolean;
}

export const AdminReviewKpiCards = ({
    summary,
    total,
    isLoading,
}: AdminReviewKpiCardsProps) => {
    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="admin-review-kpi-strip">
            {/* Completed */}
            <Card className="p-4 gap-2 shadow-xs bg-card">
                <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Completed</CardTitle>
                    <CheckCircle2 className="size-4 text-emerald-500" />
                </CardHeader>
                <CardContent className="p-0">
                    <div className="text-2xl font-bold tracking-tight text-foreground">
                        {isLoading ? '—' : (summary?.completed_count ?? '—')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Finalized shipments ready</p>
                </CardContent>
            </Card>

            {/* Cancelled */}
            <Card className="p-4 gap-2 shadow-xs bg-card">
                <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Cancelled</CardTitle>
                    <CircleOff className="size-4 text-rose-500" />
                </CardHeader>
                <CardContent className="p-0">
                    <div className="text-2xl font-bold tracking-tight text-foreground">
                        {isLoading ? '—' : (summary?.cancelled_count ?? '—')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Closed without clearance</p>
                </CardContent>
            </Card>

            {/* Missing Docs */}
            <Card className="p-4 gap-2 shadow-xs bg-card">
                <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Missing Docs</CardTitle>
                    <AlertCircle className="size-4 text-amber-500" />
                </CardHeader>
                <CardContent className="p-0">
                    <div className="text-2xl font-bold tracking-tight text-foreground">
                        {isLoading ? '—' : (summary?.missing_docs_count ?? '—')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Stages requiring review</p>
                </CardContent>
            </Card>

            {/* Total Queue */}
            <Card className="p-4 gap-2 shadow-xs bg-card">
                <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Total Queue</CardTitle>
                    <Layers className="size-4 text-muted-foreground/70" />
                </CardHeader>
                <CardContent className="p-0">
                    <div className="text-2xl font-bold tracking-tight text-foreground">
                        {total !== undefined ? total.toLocaleString() : '—'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">All reviewable records</p>
                </CardContent>
            </Card>
        </div>
    );
};
