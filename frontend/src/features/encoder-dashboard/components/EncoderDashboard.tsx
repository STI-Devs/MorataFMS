import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Truck,
    Flag,
    Clock,
    AlertCircle,
    Bell,
    FileText,
    ChevronRight,
    ChevronLeft,
    ArrowRight,
} from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '../../../components/ui/card';
import { appRoutes } from '../../../lib/appRoutes';
import { useEncoderDashboard } from '../hooks/useEncoderDashboard';
import type { EncoderDashboardAttentionItem } from '../types/encoderDashboard.types';

const statusStyles: Record<EncoderDashboardAttentionItem['status'], string> = {
    needs_update: 'border-destructive/30 bg-destructive/10 text-destructive',
    remark: 'border-warning/30 bg-warning/10 text-warning',
    missing: 'border-info/30 bg-info/10 text-info',
};

const statusLabels: Record<EncoderDashboardAttentionItem['status'], string> = {
    needs_update: 'Needs Update',
    remark: 'Open Remark',
    missing: 'Missing',
};

const typeStyles: Record<EncoderDashboardAttentionItem['type'], string> = {
    import: 'border-primary/20 bg-primary/10 text-primary',
    export: 'border-success/20 bg-success/10 text-success',
};

const typeLabels: Record<EncoderDashboardAttentionItem['type'], string> = {
    import: 'Import',
    export: 'Export',
};

const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    in_progress: '#3b82f6',
    completed: '#10b981',
    cancelled: '#f43f5e',
};

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const EncoderDashboard = () => {
    const navigate = useNavigate();
    const dashboardQuery = useEncoderDashboard();
    const dashboard = dashboardQuery.data;

    const kpis = dashboard?.kpis;
    const attentionItems = dashboard?.attention_items ?? [];
    const [queuePage, setQueuePage] = useState(1);
    const QUEUE_PAGE_SIZE = 4;
    const totalQueueItems = attentionItems.length;
    const totalQueuePages = Math.max(1, Math.ceil(totalQueueItems / QUEUE_PAGE_SIZE));
    const paginatedQueue = attentionItems.slice((queuePage - 1) * QUEUE_PAGE_SIZE, queuePage * QUEUE_PAGE_SIZE);
    const queueStartItem = totalQueueItems === 0 ? 0 : (queuePage - 1) * QUEUE_PAGE_SIZE + 1;
    const queueEndItem = Math.min(queuePage * QUEUE_PAGE_SIZE, totalQueueItems);

    const analytics = dashboard?.analytics;
    const reports = dashboard?.reports;
    const previewClients = reports?.client_volume.clients ?? [];
    const previewClientMax = Math.max(...previewClients.map((client) => client.total), 1);

    // Derived analytics & volume values
    const volumeMonths = reports?.monthly_volume.months ?? [];
    const volumeMax = Math.max(...volumeMonths.map((m) => m.total), 1);
    const currentMonthIndex = new Date().getMonth();
    const currentMonthPoint = volumeMonths[currentMonthIndex]
        ?? volumeMonths.find((m) => m.month === currentMonthIndex + 1);
    const currentMonthName = MONTH_SHORT[currentMonthIndex] ?? 'Current';
    const currentMonthTotal = currentMonthPoint?.total ?? 0;
    const currentMonthImports = currentMonthPoint?.imports ?? 0;
    const currentMonthExports = currentMonthPoint?.exports ?? 0;

    const liveStatusTotal = analytics?.status_breakdown.reduce((acc, curr) => acc + curr.value, 0) ?? 0;

    // Donut SVG calculations for Live Status Mix
    const donutRadius = 38;
    const donutCircumference = 2 * Math.PI * donutRadius;
    let accumulatedOffset = 0;

    const turnaroundImports = reports?.turnaround.imports.avg_days ?? 0;
    const turnaroundExports = reports?.turnaround.exports.avg_days ?? 0;

    const kpiCards = [
        {
            label: 'My Imports',
            value: dashboardQuery.isLoading ? '—' : (kpis?.active_imports ?? 0),
            footer: 'Active imports assigned to you',
            helper: 'Assigned sea/air freight files',
            badgeText: 'Active',
            badgeVariant: 'outline' as const,
            icon: Truck,
        },
        {
            label: 'My Exports',
            value: dashboardQuery.isLoading ? '—' : (kpis?.active_exports ?? 0),
            footer: 'Active exports assigned to you',
            helper: 'Outbound customs clearances',
            badgeText: 'Active',
            badgeVariant: 'outline' as const,
            icon: Flag,
        },
        {
            label: 'ETA/ETD This Week',
            value: dashboardQuery.isLoading ? '—' : (kpis?.upcoming_eta_etd ?? 0),
            footer: 'Arrivals/departures within 7 days',
            helper: 'Time-sensitive vessels & flights',
            badgeText: '7 Days',
            badgeVariant: 'outline' as const,
            icon: Clock,
        },
        {
            label: 'Open Remarks',
            value: dashboardQuery.isLoading ? '—' : (kpis?.open_remarks ?? 0),
            footer: 'Unresolved remarks on your files',
            helper: 'Requires encoder clarification',
            badgeText: 'Action',
            badgeVariant: 'outline' as const,
            icon: AlertCircle,
        },
        {
            label: 'No Update > 48h',
            value: dashboardQuery.isLoading ? '—' : (kpis?.needs_update ?? 0),
            footer: 'Your files with no recent activity',
            helper: 'Exceeds SLA activity threshold',
            badgeText: 'SLA Alert',
            badgeVariant: 'outline' as const,
            icon: Bell,
        },
        {
            label: 'Document Gaps',
            value: dashboardQuery.isLoading ? '—' : (kpis?.document_gaps ?? 0),
            footer: 'Completed files missing docs',
            helper: 'Missing mandatory documents',
            badgeText: 'Docs',
            badgeVariant: 'outline' as const,
            icon: FileText,
        },
    ];

    const emptyQueueState = dashboardQuery.isLoading
        ? { title: 'Loading operation queue...', body: 'Your stale files, remarks, and document gaps will appear here.' }
        : dashboardQuery.isError
            ? { title: 'Unable to load queue.', body: 'Refresh the page to retry.' }
            : { title: 'Queue clear.', body: 'No assigned issues right now.' };

    return (
        <div className="w-full space-y-6 pb-8">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                    Monitor your active workload, completed activity, and operation queue.
                </p>
            </div>

            {/* Section 1: Top 6 Metric Cards (MetricsOverview) */}
            <section className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                {kpiCards.map((card) => {
                    const IconComponent = card.icon;
                    return (
                        <Card
                            key={card.label}
                            className="cursor-pointer hover:border-border transition-all"
                        >
                            <CardHeader className="p-4 pb-2 space-y-1.5">
                                <CardDescription className="text-xs font-semibold text-muted-foreground">
                                    {card.label}
                                </CardDescription>
                                <div className="flex items-center justify-between gap-2">
                                    <CardTitle className="text-2xl font-bold tabular-nums text-foreground">
                                        {card.value}
                                    </CardTitle>
                                    <Badge
                                        variant={card.badgeVariant}
                                        className="text-[10px] px-1.5 py-0.5 font-medium shrink-0 gap-1"
                                    >
                                        <IconComponent className="size-3" />
                                        {card.badgeText}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardFooter className="flex-col items-start gap-1 text-xs p-4 pt-0">
                                <div className="line-clamp-1 flex items-center gap-1.5 font-medium text-foreground text-[11px]">
                                    {card.footer}
                                </div>
                                <div className="text-muted-foreground text-[11px] truncate">
                                    {card.helper}
                                </div>
                            </CardFooter>
                        </Card>
                    );
                })}
            </section>

            {/* Section 2: Visual Analytics & Output Row (3 Uniform Cards matching Admin Dashboard) */}
            <section className="grid gap-4 lg:grid-cols-3">
                {/* 2.1 Volume Processed (12-Month Bar Chart) */}
                <Card data-chart="monthly-volume" className="flex flex-col">
                    <CardHeader className="pb-2 space-y-1">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                Volume Processed
                            </CardTitle>
                            <div className="flex items-center gap-3 text-xs">
                                <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                                    <span className="size-2 rounded-full bg-primary shrink-0" />
                                    Import
                                </span>
                                <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                                    <span className="size-2 rounded-full bg-success shrink-0" />
                                    Export
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-muted-foreground">
                            <CardDescription className="text-xs text-muted-foreground">
                                Imports vs exports across the year
                            </CardDescription>
                            {currentMonthPoint && (
                                <Badge variant="outline" className="text-[11px] font-medium py-0 px-2 h-5 bg-muted/40 text-foreground border-border/60">
                                    <span className="font-semibold text-primary mr-1">{currentMonthName}:</span>
                                    <span className="font-semibold tabular-nums text-foreground">{currentMonthTotal}</span>
                                    <span className="text-muted-foreground ml-1">({currentMonthImports} Imp · {currentMonthExports} Exp)</span>
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="mt-auto pt-4">
                        <div className="flex h-44 items-end justify-between gap-1.5">
                            {reports ? (
                                volumeMonths.map((month) => {
                                    const importsHeight = (month.imports / volumeMax) * 100;
                                    const exportsHeight = (month.exports / volumeMax) * 100;

                                    return (
                                        <div
                                            key={month.month}
                                            className="group/bar relative flex h-full w-full flex-col justify-end items-center"
                                        >
                                            <div className="flex h-full w-full flex-col justify-end gap-[1px] px-0.5">
                                                <div
                                                    className="w-full rounded-t-xs bg-primary transition-all group-hover/bar:brightness-110"
                                                    style={{
                                                        height: `${importsHeight}%`,
                                                        minHeight: month.imports > 0 ? '4px' : '0',
                                                    }}
                                                    title={`Imports: ${month.imports}`}
                                                />
                                                <div
                                                    className="w-full rounded-b-xs bg-success transition-all group-hover/bar:brightness-110"
                                                    style={{
                                                        height: `${exportsHeight}%`,
                                                        minHeight: month.exports > 0 ? '4px' : '0',
                                                    }}
                                                    title={`Exports: ${month.exports}`}
                                                />
                                            </div>
                                            <span className="mt-2 text-center text-[10px] font-medium text-muted-foreground">
                                                {MONTH_SHORT[month.month - 1]}
                                            </span>

                                            {/* Tooltip */}
                                            <div className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-[10px] font-medium text-popover-foreground shadow-md group-hover/bar:block z-20">
                                                <span className="text-primary font-semibold">{month.imports} Imp</span> /{' '}
                                                <span className="text-success font-semibold">{month.exports} Exp</span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                    Loading volume data...
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 2.2 Status Mix (Donut + Legend matching Admin Dashboard) */}
                <Card data-chart="live-status-mix" className="flex flex-col">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                Status Mix
                            </CardTitle>
                            <Badge variant="outline" className="text-[11px] font-medium">
                                Pipeline
                            </Badge>
                        </div>
                        <CardDescription className="text-xs text-muted-foreground">
                            Active pipeline by transaction status
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto pt-2">
                        {/* Donut Chart */}
                        <div className="relative mx-auto size-32 flex items-center justify-center mb-4">
                            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r={donutRadius}
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="transparent"
                                    className="text-muted/30"
                                />
                                {analytics?.status_breakdown.map((status) => {
                                    const percentage = liveStatusTotal > 0 ? status.value / liveStatusTotal : 0;
                                    const strokeDash = percentage * donutCircumference;
                                    const strokeOffset = accumulatedOffset;
                                    accumulatedOffset += strokeDash;

                                    return (
                                        <circle
                                            key={status.key}
                                            cx="50"
                                            cy="50"
                                            r={donutRadius}
                                            stroke={statusColors[status.key] || 'var(--muted)'}
                                            strokeWidth="12"
                                            fill="transparent"
                                            strokeDasharray={`${strokeDash} ${donutCircumference}`}
                                            strokeDashoffset={-strokeOffset}
                                            className="transition-all hover:opacity-80"
                                        />
                                    );
                                })}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-xl font-bold tracking-tight text-foreground">
                                    {liveStatusTotal}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                                    Total
                                </span>
                            </div>
                        </div>

                        {/* Status Legend Pills */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {analytics?.status_breakdown.map((status) => (
                                <div
                                    key={status.key}
                                    className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/40"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span
                                            className="size-2 rounded-full shrink-0"
                                            style={{ backgroundColor: statusColors[status.key] }}
                                        />
                                        <span className="text-muted-foreground truncate">{status.label}</span>
                                    </div>
                                    <span className="font-semibold tabular-nums text-foreground">
                                        {status.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 2.3 Work Completed By You & Turnaround */}
                <Card className="flex flex-col">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                Work Completed By You
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(appRoutes.encoderReportsAnalytics)}
                                className="text-xs h-7 gap-1 text-primary hover:text-primary font-medium p-0 hover:bg-transparent"
                            >
                                View full
                                <ChevronRight className="size-3.5" />
                            </Button>
                        </div>
                        <CardDescription className="text-xs text-muted-foreground">
                            Monthly output & client workload
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3.5 pt-1">
                        {/* 3 Output Counters */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 rounded-lg bg-muted/40 border border-border/40 flex flex-col justify-center">
                                <span className="text-xl font-bold tabular-nums text-foreground">
                                    {dashboardQuery.isLoading ? '—' : (analytics?.activity.transactions_completed.this_month.total ?? 0)}
                                </span>
                                <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                                    Transactions Completed
                                </span>
                                <span className="text-[9px] text-muted-foreground/80 mt-0.5">
                                    {analytics ? `${analytics.activity.transactions_completed.this_month.imports} Imp · ${analytics.activity.transactions_completed.this_month.exports} Exp` : '—'}
                                </span>
                            </div>
                            <div className="p-2 rounded-lg bg-muted/40 border border-border/40 flex flex-col justify-center">
                                <span className="text-xl font-bold tabular-nums text-foreground">
                                    {dashboardQuery.isLoading ? '—' : (analytics?.activity.documents_uploaded.this_month.total ?? 0)}
                                </span>
                                <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                                    Documents Added
                                </span>
                                <span className="text-[9px] text-muted-foreground/80 mt-0.5">
                                    {analytics ? `${analytics.activity.documents_uploaded.this_month.imports} Imp · ${analytics.activity.documents_uploaded.this_month.exports} Exp` : '—'}
                                </span>
                            </div>
                            <div className="p-2 rounded-lg bg-muted/40 border border-border/40 flex flex-col justify-center">
                                <span className="text-xl font-bold tabular-nums text-foreground">
                                    {dashboardQuery.isLoading ? '—' : (analytics?.activity.records_finalized.this_month.total ?? 0)}
                                </span>
                                <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                                    Records Finalized
                                </span>
                                <span className="text-[9px] text-muted-foreground/80 mt-0.5">
                                    {analytics ? `${analytics.activity.records_finalized.this_month.imports} Imp · ${analytics.activity.records_finalized.this_month.exports} Exp` : '—'}
                                </span>
                            </div>
                        </div>

                        {/* Turnaround Performance Row */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/40 text-xs">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Clock className="size-3.5 text-primary shrink-0" />
                                <span className="font-medium text-[11px]">Avg. Turnaround</span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px]">
                                <span className="text-muted-foreground">
                                    <span className="font-semibold text-foreground">{turnaroundImports}d</span> Imp
                                </span>
                                <span className="text-muted-foreground">
                                    <span className="font-semibold text-foreground">{turnaroundExports}d</span> Exp
                                </span>
                            </div>
                        </div>

                        {/* Top Clients Handled */}
                        <div className="space-y-2 pt-0.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-foreground">Top Clients Handled</span>
                                <span className="text-[11px] text-muted-foreground">Volume share</span>
                            </div>
                            <div className="space-y-2">
                                {previewClients.slice(0, 3).map((client) => (
                                    <div key={client.client_id} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground truncate max-w-[180px]">{client.client_name}</span>
                                            <span className="font-semibold tabular-nums text-foreground">{client.total} files</span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-success transition-all duration-500"
                                                style={{ width: `${(client.total / previewClientMax) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {previewClients.length === 0 && (
                                    <div className="text-xs text-muted-foreground text-center py-2 bg-muted/20 rounded-lg border border-dashed border-border/60">
                                        No client records assigned yet
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Section 3: Operational Queue & SLA Watchdog (Styled 1:1 with Admin Dashboard) */}
            <section className="grid gap-4 xl:grid-cols-12 items-start">
                {/* Left Column (8 cols): Operation Queue */}
                <Card className="xl:col-span-8 flex flex-col justify-between">
                    <div>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                Operation Queue
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Assigned transactions requiring attention, stale files, and open remarks
                            </CardDescription>
                            {attentionItems.length > 0 && (
                                <CardAction>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate(appRoutes.tracking)}
                                        className="h-8 text-xs font-medium text-muted-foreground hover:text-primary gap-1 px-2.5"
                                    >
                                        <span>View all ({attentionItems.length})</span>
                                        <ArrowRight className="size-3.5" />
                                    </Button>
                                </CardAction>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-2.5">
                            {attentionItems.length === 0 ? (
                                <div className="p-8 text-center text-sm text-muted-foreground">
                                    <p className="font-semibold text-foreground">{emptyQueueState.title}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{emptyQueueState.body}</p>
                                </div>
                            ) : (
                                paginatedQueue.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => navigate(appRoutes.trackingDetail.replace(':referenceId', encodeURIComponent(item.ref)))}
                                        className="group flex w-full items-center justify-between p-3.5 rounded-xl border border-border/60 bg-card hover:border-border hover:bg-muted/40 text-left transition-all shadow-xs"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                                                {item.status === 'needs_update' ? (
                                                    <AlertCircle className="size-4 text-destructive" />
                                                ) : item.status === 'remark' ? (
                                                    <AlertCircle className="size-4 text-warning" />
                                                ) : (
                                                    <FileText className="size-4 text-info" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                                        {item.ref}
                                                    </span>
                                                    <span className={`inline-flex w-fit rounded-md uppercase px-1.5 py-0 text-[10px] font-semibold border ${statusStyles[item.status]}`}>
                                                        {statusLabels[item.status]}
                                                    </span>
                                                    <span className={`inline-flex items-center rounded-md border px-1.5 py-0 text-[10px] font-medium ${typeStyles[item.type]}`}>
                                                        {typeLabels[item.type]}
                                                    </span>
                                                </div>
                                                <p className="mt-0.5 text-xs text-muted-foreground truncate group-hover:text-foreground transition-colors">
                                                    <span className="font-medium text-foreground">{item.title}</span> — {item.detail}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 pl-2 text-muted-foreground">
                                            <span className="text-[11px] font-mono">{item.age}</span>
                                            <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </button>
                                ))
                            )}
                        </CardContent>
                    </div>

                    {/* Compact In-Card Pagination */}
                    {totalQueuePages > 1 && (
                        <CardFooter className="flex items-center justify-between border-t border-border/50 p-3.5 text-xs text-muted-foreground">
                            <span>
                                Showing <strong className="font-semibold text-foreground">{queueStartItem}–{queueEndItem}</strong> of{' '}
                                <strong className="font-semibold text-foreground">{totalQueueItems}</strong> items
                            </span>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={queuePage <= 1}
                                    onClick={() => setQueuePage((p) => Math.max(1, p - 1))}
                                    className="h-7 w-7 p-0"
                                >
                                    <span className="sr-only">Previous page</span>
                                    <ChevronLeft className="size-3.5" />
                                </Button>
                                <span className="text-[11px] font-medium px-1.5">
                                    Page {queuePage} of {totalQueuePages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={queuePage >= totalQueuePages}
                                    onClick={() => setQueuePage((p) => Math.min(totalQueuePages, p + 1))}
                                    className="h-7 w-7 p-0"
                                >
                                    <span className="sr-only">Next page</span>
                                    <ChevronRight className="size-3.5" />
                                </Button>
                            </div>
                        </CardFooter>
                    )}
                </Card>

                {/* Right Column (4 cols): Overdue SLA Watchdog */}
                <Card className="xl:col-span-4 flex flex-col justify-between">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Overdue Transactions
                        </CardTitle>
                        <CardDescription className="mt-1 text-xs">
                            Active records beyond the 48h update SLA threshold.
                        </CardDescription>
                        <CardAction>
                            <Badge
                                variant="outline"
                                className={`text-xs font-semibold px-2 py-0.5 shrink-0 ${
                                    (analytics?.overdue_transactions.total ?? 0) > 0
                                        ? 'text-destructive border-destructive/20 bg-destructive/10'
                                        : 'text-success border-success/20 bg-success/10'
                                }`}
                            >
                                {analytics?.overdue_transactions.total ?? 0} Flagged
                            </Badge>
                        </CardAction>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {/* Imports Overdue Card */}
                        <div className="flex flex-col justify-between p-3.5 rounded-xl border border-border/60 bg-card shadow-xs space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Truck className="size-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-foreground">Import Overdue</p>
                                        <p className="text-[10px] text-muted-foreground">Past 48h SLA</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    oldest: {analytics?.overdue_transactions.imports.oldest_hours ?? '—'}h
                                </Badge>
                            </div>

                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold tabular-nums text-foreground">
                                    {analytics?.overdue_transactions.imports.overdue_count ?? 0}
                                </span>
                                <span className="text-xs text-muted-foreground">overdue records</span>
                            </div>

                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-primary transition-all duration-500"
                                    style={{
                                        width: `${
                                            (analytics?.overdue_transactions.total ?? 0) > 0
                                                ? Math.max(
                                                      ((analytics?.overdue_transactions.imports.overdue_count ?? 0) /
                                                          (analytics?.overdue_transactions.total ?? 1)) *
                                                          100,
                                                      (analytics?.overdue_transactions.imports.overdue_count ?? 0) > 0 ? 15 : 0
                                                  )
                                                : 0
                                        }%`,
                                    }}
                                />
                            </div>

                            <div className="flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <span className="font-semibold text-muted-foreground">48–72h:</span>
                                    <span className="font-medium text-foreground">{analytics?.overdue_transactions.imports.stale_48_72_count ?? 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="font-semibold text-muted-foreground">72h+:</span>
                                    <span className="font-medium text-foreground">{analytics?.overdue_transactions.imports.stale_over_72_count ?? 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Exports Overdue Card */}
                        <div className="flex flex-col justify-between p-3.5 rounded-xl border border-border/60 bg-card shadow-xs space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                                        <Flag className="size-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-foreground">Export Overdue</p>
                                        <p className="text-[10px] text-muted-foreground">Past 48h SLA</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    oldest: {analytics?.overdue_transactions.exports.oldest_hours ?? '—'}h
                                </Badge>
                            </div>

                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold tabular-nums text-foreground">
                                    {analytics?.overdue_transactions.exports.overdue_count ?? 0}
                                </span>
                                <span className="text-xs text-muted-foreground">overdue records</span>
                            </div>

                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-success transition-all duration-500"
                                    style={{
                                        width: `${
                                            (analytics?.overdue_transactions.total ?? 0) > 0
                                                ? Math.max(
                                                      ((analytics?.overdue_transactions.exports.overdue_count ?? 0) /
                                                          (analytics?.overdue_transactions.total ?? 1)) *
                                                          100,
                                                      (analytics?.overdue_transactions.exports.overdue_count ?? 0) > 0 ? 15 : 0
                                                  )
                                                : 0
                                        }%`,
                                    }}
                                />
                            </div>

                            <div className="flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <span className="font-semibold text-muted-foreground">48–72h:</span>
                                    <span className="font-medium text-foreground">{analytics?.overdue_transactions.exports.stale_48_72_count ?? 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="font-semibold text-muted-foreground">72h+:</span>
                                    <span className="font-medium text-foreground">{analytics?.overdue_transactions.exports.stale_over_72_count ?? 0}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
};
