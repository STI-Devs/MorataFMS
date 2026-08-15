import { ArrowDownRight, ArrowUpRight, CheckCircle2, FileSpreadsheet, FolderSync, ShieldAlert } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../../../components/ui/card';
import { Progress } from '../../../components/ui/progress';
import type { AdminDashboardAnalytics, AdminDashboardRecordsSummary } from '../types/adminDashboard.types';

const overdueCards = [
    {
        key: 'imports',
        label: 'Import Overdue',
        icon: ArrowDownRight,
        accentTextClass: 'text-primary',
        accentSurfaceClass: 'bg-primary/10 text-primary',
        barClass: '[&>div]:bg-primary',
    },
    {
        key: 'exports',
        label: 'Export Overdue',
        icon: ArrowUpRight,
        accentTextClass: 'text-success',
        accentSurfaceClass: 'bg-success/10 text-success',
        barClass: '[&>div]:bg-success',
    },
] as const;

type OverdueKey = (typeof overdueCards)[number]['key'];

export const OperationalHealth = ({
    analytics,
    recordsSummary,
}: {
    analytics: AdminDashboardAnalytics;
    recordsSummary: AdminDashboardRecordsSummary;
}) => {
    const overdue = analytics.overdue_transactions;

    const recordsTiles = [
        { label: 'Ready for Archive', count: recordsSummary.archive_ready_count, valueClass: 'text-success', icon: CheckCircle2 },
        { label: 'Missing Archive Docs', count: recordsSummary.missing_docs_count, valueClass: 'text-warning', icon: FileSpreadsheet },
        { label: 'Completed in Review', count: recordsSummary.completed_count, valueClass: 'text-foreground', icon: FolderSync },
        { label: 'Cancelled in Review', count: recordsSummary.cancelled_count, valueClass: 'text-danger', icon: ShieldAlert },
    ] as const;

    return (
        <section className="grid gap-4 xl:grid-cols-12">
            {/* Overdue Transactions */}
            <Card className="xl:col-span-7">
                <CardHeader>
                    <CardTitle>Overdue Transactions</CardTitle>
                    <CardDescription>Active records beyond the update threshold and needing follow-up.</CardDescription>
                    <CardAction>
                        <Badge variant="outline">{overdue.threshold_hours}+h without update</Badge>
                    </CardAction>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/40 p-3">
                        <div>
                            <p className="text-sm font-semibold text-foreground">Overdue Queue Size</p>
                            <p className="text-xs text-muted-foreground">Exceeded service level update target</p>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold tabular-nums text-foreground">{overdue.total}</span>
                            <span className="text-xs font-medium text-muted-foreground">flagged records</span>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        {overdueCards.map((card) => {
                            const stats = overdue[card.key as OverdueKey];
                            const overdueCount = stats.overdue_count;
                            const barWidth = overdue.total
                                ? Math.max((overdueCount / overdue.total) * 100, overdueCount > 0 ? 12 : 0)
                                : 0;
                            const CardIcon = card.icon;

                            return (
                                <div
                                    key={card.key}
                                    className="flex flex-col justify-between rounded-xl border border-border/50 bg-card/60 p-3.5 shadow-xs"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${card.accentSurfaceClass}`}>
                                                <CardIcon className="size-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-foreground">{card.label}</p>
                                                <p className="text-[11px] text-muted-foreground">No staff update past SLA</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                                            oldest: {stats.oldest_hours ?? '—'}h
                                        </Badge>
                                    </div>

                                    <div className="my-3 flex items-baseline gap-1.5">
                                        <span className="text-2xl font-bold tabular-nums text-foreground">{overdueCount}</span>
                                        <span className="text-xs text-muted-foreground">overdue records</span>
                                    </div>

                                    <Progress value={barWidth} className={`mb-3 ${card.barClass}`} />

                                    <div className="flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold text-muted-foreground">48-72h:</span>
                                            <span className="font-medium text-foreground">{stats.stale_48_72_count}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold text-muted-foreground">72h+:</span>
                                            <span className="font-medium text-foreground">{stats.stale_over_72_count}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Records & Archive */}
            <Card className="flex flex-col justify-between xl:col-span-5">
                <CardHeader>
                    <CardTitle>Records &amp; Archive</CardTitle>
                    <CardDescription>Post-operations archive readiness and review load.</CardDescription>
                    <CardAction>
                        <Badge variant="secondary">Post-Operations</Badge>
                    </CardAction>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/40 p-3">
                        <div>
                            <p className="text-sm font-semibold text-foreground">Records In Review</p>
                            <p className="text-xs text-muted-foreground">Pending archival compliance check</p>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold tabular-nums text-foreground">{recordsSummary.in_review_count}</span>
                            <span className="text-xs font-medium text-muted-foreground">queue size</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        {recordsTiles.map((tile) => {
                            const TileIcon = tile.icon;
                            return (
                                <div
                                    key={tile.label}
                                    className="flex flex-col justify-between rounded-xl border border-border/50 bg-card/60 p-3 shadow-xs"
                                >
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <span className="truncate text-xs font-medium text-muted-foreground">{tile.label}</span>
                                        <TileIcon className={`size-3.5 ${tile.valueClass} opacity-80`} />
                                    </div>
                                    <p className={`text-xl font-bold tabular-nums tracking-tight ${tile.valueClass}`}>
                                        {tile.count}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </section>
    );
};
