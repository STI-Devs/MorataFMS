import { useNavigate } from 'react-router-dom';
import {
    Activity,
    AlertCircle,
    Archive,
    ArrowDownRight,
    ArrowUpRight,
    Calendar,
    CheckCircle2,
    Clock,
    FileCheck2,
    FileSpreadsheet,
    FileText,
    Flag,
    FolderSync,
    ShieldAlert,
    TrendingDown,
    TrendingUp,
    Truck,
    UserCheck,
    Users,
} from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '../../../components/ui/card';
import { appRoutes } from '../../../lib/appRoutes';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { useAdminDashboard } from '../hooks/useAdminDashboard';
import type { AdminDashboardCriticalItem, AdminDashboardDestination } from '../types/adminDashboard.types';

type KpiCard = {
    label: string;
    value: string;
    helper: string;
    footer: string;
    icon: typeof Activity;
    badgeText: string;
    badgeIcon: typeof TrendingUp;
    badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
};

type QuickAction = {
    label: string;
    path: string;
    icon: typeof FileText;
    description: string;
};

const quickActions: QuickAction[] = [
    { label: 'Document Review', path: appRoutes.adminDocumentReview, icon: FileCheck2, description: 'Verify uploaded stage documents' },
    { label: 'Transaction Oversight', path: appRoutes.transactions, icon: Archive, description: 'Master registry & status control' },
    { label: 'Live Tracking', path: appRoutes.liveTracking, icon: Clock, description: 'Active shipment milestone monitor' },
    { label: 'Reports & Analytics', path: appRoutes.reports, icon: Flag, description: 'Export performance & throughput data' },
    { label: 'User Management', path: appRoutes.users, icon: Users, description: 'Role permissions & account control' },
    { label: 'Client Management', path: appRoutes.clients, icon: Truck, description: 'Consignees, shippers & accounts' },
];

const statusLabels: Record<AdminDashboardCriticalItem['status'], string> = {
    stuck: 'Needs Update',
    missing: 'Missing',
    review: 'Review',
};

const statusBadgeVariants: Record<AdminDashboardCriticalItem['status'], 'destructive' | 'warning' | 'info'> = {
    stuck: 'destructive',
    missing: 'warning',
    review: 'info',
};

const dashboardDestinationPaths: Record<AdminDashboardDestination, string> = {
    transactions: appRoutes.transactions,
    admin_document_review: appRoutes.adminDocumentReview,
};

const EmptyState = ({ title, body }: { title: string; body: string }) => (
    <div className="px-6 py-10 text-center">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
);

const actionLeadIn = (action: string): string => {
    if (action === 'Document Alert') return 'raised';
    if (action === 'Encoder Reassigned' || action === 'Status Override') return 'performed';
    return 'recorded';
};

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const AdminDashboard = () => {
    const navigate = useNavigate();
    const dashboardQuery = useAdminDashboard();
    const dashboard = dashboardQuery.data;

    if (dashboardQuery.isLoading) {
        return (
            <div className="w-full space-y-6">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-72" />
                    </div>
                    <Skeleton className="h-6 w-28" />
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-border/80 p-4 space-y-2 bg-card">
                            <Skeleton className="h-3.5 w-24" />
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-7 w-12" />
                                <Skeleton className="h-5 w-14 rounded-md" />
                            </div>
                            <Skeleton className="h-3 w-full" />
                        </div>
                    ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-xl border border-border/80 p-6 space-y-4 bg-card h-64">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-full w-full" />
                    </div>
                    <div className="rounded-xl border border-border/80 p-6 space-y-4 bg-card h-64">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-full w-full" />
                    </div>
                    <div className="rounded-xl border border-border/80 p-6 space-y-4 bg-card h-64">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-full w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (dashboardQuery.isError) {
        return (
            <div className="w-full py-16 flex items-center justify-center">
                <div className="flex flex-col items-center justify-center p-8 text-center max-w-md rounded-xl border border-border bg-card shadow-sm">
                    <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
                        <AlertCircle className="size-6" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">Couldn't load your dashboard</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        We encountered an issue fetching the latest operational metrics. Please try again.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => dashboardQuery.refetch()}
                        className="mt-5 cursor-pointer"
                    >
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    const kpiCards: KpiCard[] = [
        {
            label: 'Active Imports',
            value: String(dashboard?.kpis.active_imports ?? 0),
            helper: 'Open import workload',
            footer: 'Active customs filings',
            icon: ArrowDownRight,
            badgeText: 'Inbound',
            badgeIcon: ArrowDownRight,
            badgeVariant: 'info',
        },
        {
            label: 'Active Exports',
            value: String(dashboard?.kpis.active_exports ?? 0),
            helper: 'Open export workload',
            footer: 'Outbound processing',
            icon: ArrowUpRight,
            badgeText: 'Outbound',
            badgeIcon: ArrowUpRight,
            badgeVariant: 'success',
        },
        {
            label: 'ETA/ETD This Week',
            value: String(dashboard?.kpis.upcoming_eta_etd ?? 0),
            helper: 'Arrivals/departures within 7 days',
            footer: 'Vessel arrivals & departures',
            icon: Calendar,
            badgeText: '7 Days',
            badgeIcon: Calendar,
            badgeVariant: 'warning',
        },
        {
            label: 'Open Remarks',
            value: String(dashboard?.kpis.open_remarks ?? 0),
            helper: 'Unresolved operational blockers',
            footer: 'Pending resolution',
            icon: AlertCircle,
            badgeText: 'Action Req',
            badgeIcon: AlertCircle,
            badgeVariant: 'destructive',
        },
        {
            label: 'Needs Update',
            value: String(dashboard?.kpis.delayed_shipments ?? 0),
            helper: 'No activity logged for 48+ hours',
            footer: 'Exceeded update target',
            icon: Clock,
            badgeText: '48h+ SLA',
            badgeIcon: TrendingDown,
            badgeVariant: 'destructive',
        },
        {
            label: 'Document Gaps',
            value: String(dashboard?.kpis.missing_final_docs ?? 0),
            helper: 'Finalized files still incomplete',
            footer: 'Incomplete archives',
            icon: FileText,
            badgeText: 'Missing',
            badgeIcon: FileText,
            badgeVariant: 'warning',
        },
    ];

    const criticalOperations = dashboard?.critical_operations ?? [];
    const actionFeed = dashboard?.action_feed ?? [];
    const brokerageWorkloads = dashboard?.workloads ?? [];
    const recordsSummary = dashboard?.records_summary;
    const analytics = dashboard?.analytics;

    // Derived analytics values
    const volumeMax = analytics ? Math.max(...analytics.monthly_volume.months.map((m) => m.total), 1) : 1;
    const importsPercentage = analytics?.transaction_flow.total
        ? Math.round((analytics.transaction_flow.imports / analytics.transaction_flow.total) * 100)
        : 0;
    const exportsPercentage = analytics?.transaction_flow.total
        ? Math.round((analytics.transaction_flow.exports / analytics.transaction_flow.total) * 100)
        : 0;
    const completionRate = analytics?.transaction_flow.completion_rate ?? 0;
    const completedVolume = analytics?.transaction_flow.completed ?? 0;
    const liveStatusTotal = analytics?.status_breakdown.reduce((acc, curr) => acc + curr.value, 0) ?? 0;
    const overdueTransactions = analytics?.overdue_transactions;

    const overdueCards: Array<{
        key: 'imports' | 'exports';
        label: string;
        icon: typeof ArrowDownRight;
        accentTextClass: string;
        accentSurfaceClass: string;
        accentBarClass: string;
    }> = [
        {
            key: 'imports',
            label: 'Import Overdue',
            icon: ArrowDownRight,
            accentTextClass: 'text-primary',
            accentSurfaceClass: 'bg-primary/10',
            accentBarClass: 'bg-primary',
        },
        {
            key: 'exports',
            label: 'Export Overdue',
            icon: ArrowUpRight,
            accentTextClass: 'text-success',
            accentSurfaceClass: 'bg-success/10',
            accentBarClass: 'bg-success',
        },
    ];

    const recordsTiles = [
        {
            label: 'Ready for Archive',
            value: recordsSummary?.archive_ready_count ?? 0,
            valueClass: 'text-success',
            icon: CheckCircle2,
        },
        {
            label: 'Missing Archive Docs',
            value: recordsSummary?.missing_docs_count ?? 0,
            valueClass: 'text-warning',
            icon: FileSpreadsheet,
        },
        {
            label: 'Completed in Review',
            value: recordsSummary?.completed_count ?? 0,
            valueClass: 'text-foreground',
            icon: FolderSync,
        },
        {
            label: 'Cancelled in Review',
            value: recordsSummary?.cancelled_count ?? 0,
            valueClass: 'text-danger',
            icon: ShieldAlert,
        },
    ];

    const statusColors: Record<string, string> = {
        pending: 'var(--warning)',
        in_progress: 'var(--info)',
        completed: 'var(--success)',
        cancelled: 'var(--danger)',
    };

    // Donut SVG calculations for Live Status Mix
    const donutRadius = 38;
    const donutCircumference = 2 * Math.PI * donutRadius;
    let accumulatedOffset = 0;

    return (
        <div className="w-full space-y-6 pb-8">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                    Overview of active brokerage operations and metrics.
                </p>
            </div>

            {/* Section 1: Template-Style Top Metric Cards (MetricsOverview) */}
            <section className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                {kpiCards.map((card) => {
                    const BadgeIcon = card.badgeIcon;
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
                                        variant={card.badgeVariant ?? 'outline'}
                                        className="text-[10px] px-1.5 py-0.5 font-medium shrink-0 gap-1"
                                    >
                                        <BadgeIcon className="size-3" />
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

                {/* Section 2: Visual Analytics & Performance Row */}
                <section className="grid gap-4 lg:grid-cols-3">
                    {/* 2.1 Monthly Volume */}
                    <Card data-chart="monthly-volume" className="flex flex-col">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Monthly Volume
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
                            <CardDescription className="text-xs text-muted-foreground">
                                Imports vs exports, year to date
                            </CardDescription>
                            <div className="flex items-baseline gap-2 pt-1">
                                <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
                                    {analytics?.monthly_volume.total ?? '—'}
                                </span>
                                <span className="text-xs text-muted-foreground font-medium">
                                    Total Files YTD
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="mt-auto pt-2">
                            <div className="flex h-36 items-end justify-between gap-1.5 pt-4">
                                {analytics ? (
                                    analytics.monthly_volume.months.map((month) => (
                                        <div
                                            key={month.month}
                                            className="group/bar relative flex h-full w-full flex-col justify-end items-center"
                                        >
                                            <div className="flex h-full w-full flex-col justify-end gap-[1px] px-0.5">
                                                <div
                                                    className="w-full rounded-t-xs bg-primary transition-all group-hover/bar:brightness-110"
                                                    style={{
                                                        height: `${(month.imports / volumeMax) * 100}%`,
                                                        minHeight: month.imports > 0 ? '4px' : '0',
                                                    }}
                                                />
                                                <div
                                                    className="w-full rounded-b-xs bg-success transition-all group-hover/bar:brightness-110"
                                                    style={{
                                                        height: `${(month.exports / volumeMax) * 100}%`,
                                                        minHeight: month.exports > 0 ? '4px' : '0',
                                                    }}
                                                />
                                            </div>
                                            <span className="mt-2 text-center text-[10px] font-medium text-muted-foreground">
                                                {monthNames[month.month - 1]}
                                            </span>

                                            {/* Tooltip */}
                                            <div className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-[10px] font-medium text-popover-foreground shadow-md group-hover/bar:block z-20">
                                                <span className="text-primary font-semibold">{month.imports} Imp</span> /{' '}
                                                <span className="text-success font-semibold">{month.exports} Exp</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                        Loading volume data...
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2.2 Status Mix (Donut + Legend) */}
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
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                        Active
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

                    {/* 2.3 Transaction Distribution */}
                    <Card className="flex flex-col">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Transaction Distribution
                                </CardTitle>
                                <Badge variant="secondary" className="text-[11px] font-medium">
                                    Flow
                                </Badge>
                            </div>
                            <CardDescription className="text-xs text-muted-foreground">
                                Share of year-to-date volume
                            </CardDescription>
                            <div className="flex items-baseline gap-2 pt-1">
                                <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
                                    {analytics?.transaction_flow.total ?? '—'}
                                </span>
                                <span className="text-xs text-muted-foreground font-medium">
                                    YTD Volume
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="mt-auto space-y-4 pt-2">
                            <div>
                                <div className="mb-1.5 flex justify-between text-xs font-medium">
                                    <span className="text-muted-foreground">Imports</span>
                                    <span className="text-foreground font-semibold">
                                        {analytics?.transaction_flow.imports ?? '—'} ({importsPercentage}%)
                                    </span>
                                </div>
                                <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="bg-primary rounded-full transition-all duration-500"
                                        style={{ width: `${importsPercentage}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="mb-1.5 flex justify-between text-xs font-medium">
                                    <span className="text-muted-foreground">Exports</span>
                                    <span className="text-foreground font-semibold">
                                        {analytics?.transaction_flow.exports ?? '—'} ({exportsPercentage}%)
                                    </span>
                                </div>
                                <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="bg-success rounded-full transition-all duration-500"
                                        style={{ width: `${exportsPercentage}%` }}
                                    />
                                </div>
                            </div>

                            <div className="border-t border-border/50 pt-3">
                                <div className="mb-1.5 flex justify-between text-xs font-medium">
                                    <span className="text-muted-foreground">Completion Rate</span>
                                    <span className="text-foreground font-semibold">
                                        {completionRate}% · {completedVolume} completed
                                    </span>
                                </div>
                                <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="bg-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${completionRate}%` }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Section 3: Operational SLA & Archive Readiness */}
                <section className="grid gap-4 xl:grid-cols-12">
                    {/* Overdue Transactions */}
                    <Card className="xl:col-span-7">
                        <CardHeader className="flex-row items-start justify-between pb-3">
                            <div>
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Overdue Transactions
                                </CardTitle>
                                <CardDescription className="mt-1 text-xs">
                                    Active records beyond the update threshold and needing follow-up.
                                </CardDescription>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-wider shrink-0">
                                {overdueTransactions?.threshold_hours ?? 48}+h without update
                            </Badge>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Overdue Queue Size
                                    </p>
                                    <p className="text-xs text-muted-foreground">Exceeded service level update target</p>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-bold tabular-nums text-foreground">
                                        {overdueTransactions?.total ?? '—'}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-medium">
                                        flagged records
                                    </span>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {overdueCards.map((card) => {
                                    const stats = overdueTransactions?.[card.key];
                                    const overdueCount = stats?.overdue_count ?? 0;
                                    const barWidth = overdueTransactions?.total
                                        ? Math.max((overdueCount / overdueTransactions.total) * 100, overdueCount > 0 ? 12 : 0)
                                        : 0;
                                    const CardIcon = card.icon;

                                    return (
                                        <div
                                            key={card.key}
                                            className="flex flex-col justify-between p-3.5 rounded-xl border border-border/50 bg-card/60 shadow-xs"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${card.accentSurfaceClass} ${card.accentTextClass}`}>
                                                        <CardIcon className="size-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-foreground">
                                                            {card.label}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            No staff update past SLA
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                    oldest: {stats?.oldest_hours ?? '—'}h
                                                </Badge>
                                            </div>

                                            <div className="my-3 flex items-baseline gap-1.5">
                                                <span className="text-2xl font-bold tabular-nums text-foreground">
                                                    {overdueCount}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    overdue records
                                                </span>
                                            </div>

                                            <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className={`h-full rounded-full ${card.accentBarClass} transition-all duration-500`}
                                                    style={{ width: `${barWidth}%` }}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-semibold text-muted-foreground">48-72h:</span>
                                                    <span className="font-medium text-foreground">{stats?.stale_48_72_count ?? 0}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-semibold text-muted-foreground">72h+:</span>
                                                    <span className="font-medium text-foreground">{stats?.stale_over_72_count ?? 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Records & Archive */}
                    <Card className="xl:col-span-5 flex flex-col justify-between">
                        <CardHeader className="flex-row items-start justify-between pb-3">
                            <div>
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Records &amp; Archive
                                </CardTitle>
                                <CardDescription className="mt-1 text-xs">
                                    Post-operations archive readiness and review load.
                                </CardDescription>
                            </div>
                            <Badge variant="secondary" className="text-[10px] font-medium uppercase tracking-wider shrink-0">
                                Post-Operations
                            </Badge>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Records In Review
                                    </p>
                                    <p className="text-xs text-muted-foreground">Pending archival compliance check</p>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-bold tabular-nums text-foreground">
                                        {recordsSummary?.in_review_count ?? '—'}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-medium">
                                        queue size
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                {recordsTiles.map((tile) => {
                                    const TileIcon = tile.icon;
                                    return (
                                        <div
                                            key={tile.label}
                                            className="flex flex-col justify-between p-3 rounded-xl border border-border/50 bg-card/60 shadow-xs"
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[11px] font-medium text-muted-foreground truncate">
                                                    {tile.label}
                                                </span>
                                                <TileIcon className={`size-3.5 ${tile.valueClass} opacity-80`} />
                                            </div>
                                            <p className={`text-xl font-bold tabular-nums tracking-tight ${tile.valueClass}`}>
                                                {tile.value}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Section 4: Operational Workspace (Modules, Operation Queue, Encoder Workload, Audit Log) */}
                <div className="grid gap-4 xl:grid-cols-12 items-start">
                    {/* Left Column (8 cols): Modules & Operation Queue */}
                    <div className="space-y-4 xl:col-span-8">
                        {/* Modules Quick Action Tiles */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Modules
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Quick shortcuts to core customs brokerage workflows
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                                    {quickActions.map((action) => {
                                        const ActionIcon = action.icon;
                                        return (
                                            <button
                                                key={action.label}
                                                type="button"
                                                onClick={() => navigate(action.path)}
                                                className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 text-left transition-all hover:border-border hover:bg-accent/50 hover:shadow-xs"
                                            >
                                                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-muted-foreground transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
                                                    <ActionIcon className="size-4" />
                                                </div>
                                                <span className="text-xs font-semibold text-foreground">
                                                    {action.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Critical Operation Queue (Styled like recent-transactions.tsx) */}
                        <Card>
                            <CardHeader className="flex-row items-center justify-between pb-3">
                                <div>
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                        Operation Queue
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Urgent exceptions, blocked stages, and pending admin reviews
                                    </CardDescription>
                                </div>
                                {criticalOperations.length > 0 && (
                                    <Badge variant="secondary" className="text-xs font-medium">
                                        {criticalOperations.length} items
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {criticalOperations.length === 0 ? (
                                    <EmptyState
                                        title="All clear — no critical issues."
                                        body="Stale records, missing archive documents, and flagged exceptions will appear here."
                                    />
                                ) : (
                                    criticalOperations.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => navigate(dashboardDestinationPaths[item.destination])}
                                            className="group flex w-full items-center justify-between p-3 rounded-xl border border-border/60 bg-card/60 hover:bg-muted/40 text-left transition-all shadow-xs"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                                                    {item.status === 'stuck' ? (
                                                        <AlertCircle className="size-4 text-danger" />
                                                    ) : item.status === 'missing' ? (
                                                        <FileText className="size-4 text-warning" />
                                                    ) : (
                                                        <Clock className="size-4 text-primary" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-foreground">
                                                            {item.ref}
                                                        </span>
                                                        <Badge
                                                            variant={statusBadgeVariants[item.status]}
                                                            className="text-[10px] px-1.5 py-0 uppercase"
                                                        >
                                                            {statusLabels[item.status]}
                                                        </Badge>
                                                    </div>
                                                    <p className="mt-0.5 text-xs text-muted-foreground truncate group-hover:text-foreground transition-colors">
                                                        {item.title}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-mono text-muted-foreground shrink-0 pl-2">
                                                {item.age}
                                            </span>
                                        </button>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column (4 cols): Encoder Workload & Audit Log */}
                    <div className="space-y-4 xl:col-span-4">
                        {/* Encoder Workload */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Encoder Workload
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Staff assignment and throughput monitoring
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {brokerageWorkloads.length === 0 ? (
                                    <EmptyState
                                        title="No encoder workloads yet."
                                        body="Active brokerage assignments will appear here."
                                    />
                                ) : (
                                    brokerageWorkloads.map((person) => (
                                        <div
                                            key={person.id}
                                            className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/50 bg-card/60 shadow-xs"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-muted font-bold text-xs text-foreground">
                                                    {person.name.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-semibold text-foreground">
                                                        {person.name}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground truncate">
                                                        {person.role}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-right">
                                                {person.overdue > 0 && (
                                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                                        {person.overdue} late
                                                    </Badge>
                                                )}
                                                <span className="text-xs font-semibold tabular-nums text-foreground">
                                                    {person.active}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {/* Audit Log */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Audit Log
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Recent administrative modifications
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {actionFeed.length === 0 ? (
                                    <EmptyState
                                        title="No admin activity recorded yet."
                                        body="Status overrides, reassignments, and document alerts will show here."
                                    />
                                ) : (
                                    actionFeed.map((item) => (
                                        <div key={item.id} className="flex gap-3 p-3 rounded-xl border border-border/50 bg-card/60 shadow-xs">
                                            <div className="mt-0.5 shrink-0 text-muted-foreground">
                                                {item.action === 'Document Alert' ? (
                                                    <FileText className="size-3.5 text-warning" />
                                                ) : (
                                                    <UserCheck className="size-3.5 text-primary" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs text-muted-foreground leading-snug">
                                                    <span className="font-semibold text-foreground">{item.actor}</span>{' '}
                                                    {actionLeadIn(item.action)}{' '}
                                                    <span className="font-semibold text-foreground">{item.target}</span>
                                                </p>
                                                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                                    {item.detail}
                                                </p>
                                                <p className="mt-1 text-[10px] font-mono text-muted-foreground/70">
                                                    {item.age}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
        </div>
    );
};
