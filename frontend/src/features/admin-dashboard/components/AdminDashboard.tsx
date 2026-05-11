import { Icon, type IconName } from '../../../components/Icon';
import { appRoutes } from '../../../lib/appRoutes';
import { useNavigate } from 'react-router-dom';
import { useAdminDashboard } from '../hooks/useAdminDashboard';
import type { AdminDashboardCriticalItem, AdminDashboardDestination } from '../types/adminDashboard.types';

type KpiCard = {
    label: string;
    value: string;
    helper: string;
    color: string;
    icon: string;
};

type QuickAction = {
    label: string;
    path: string;
    icon: IconName;
    accent: string;
};

const quickActions: QuickAction[] = [
    { label: 'Document Review', path: appRoutes.adminDocumentReview, icon: 'file-text', accent: '#0a84ff' },
    { label: 'Transaction Oversight', path: appRoutes.transactions, icon: 'archive', accent: '#30d158' },
    { label: 'Live Tracking', path: appRoutes.liveTracking, icon: 'clock', accent: '#64d2ff' },
    { label: 'Reports & Analytics', path: appRoutes.reports, icon: 'flag', accent: '#ff9f0a' },
    { label: 'User Management', path: appRoutes.users, icon: 'user', accent: '#bf5af2' },
    { label: 'Client Management', path: appRoutes.clients, icon: 'truck', accent: '#30d158' },
];

const statusLabels: Record<AdminDashboardCriticalItem['status'], string> = {
    stuck: 'Needs Update',
    missing: 'Missing',
    review: 'Review',
};

const dashboardDestinationPaths: Record<AdminDashboardDestination, string> = {
    transactions: appRoutes.transactions,
    admin_document_review: appRoutes.adminDocumentReview,
};

const EmptyState = ({ title, body }: { title: string; body: string }) => (
    <div className="px-6 py-10 text-center">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="mt-1 text-[13px] text-text-secondary">{body}</p>
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

    const kpiCards: KpiCard[] = [
        {
            label: 'Active Imports',
            value: dashboardQuery.isLoading ? '—' : String(dashboard?.kpis.active_imports ?? 0),
            helper: 'Open import workload',
            color: '#0a84ff',
            icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
        },
        {
            label: 'Active Exports',
            value: dashboardQuery.isLoading ? '—' : String(dashboard?.kpis.active_exports ?? 0),
            helper: 'Open export workload',
            color: '#30d158',
            icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
        },
        {
            label: 'ETA/ETD This Week',
            value: dashboardQuery.isLoading ? '—' : String(dashboard?.kpis.upcoming_eta_etd ?? 0),
            helper: 'Arrivals/departures within 7 days',
            color: '#ff9f0a',
            icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
        },
        {
            label: 'Open Remarks',
            value: dashboardQuery.isLoading ? '—' : String(dashboard?.kpis.open_remarks ?? 0),
            helper: 'Unresolved operational blockers',
            color: '#ff453a',
            icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
        },
        {
            label: 'Needs Update',
            value: dashboardQuery.isLoading ? '—' : String(dashboard?.kpis.delayed_shipments ?? 0),
            helper: 'No activity logged for 48+ hours',
            color: '#bf5af2',
            icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        },
        {
            label: 'Document Gaps',
            value: dashboardQuery.isLoading ? '—' : String(dashboard?.kpis.missing_final_docs ?? 0),
            helper: 'Finalized files still incomplete',
            color: '#ff453a',
            icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        },
    ];

    const criticalOperations = dashboard?.critical_operations ?? [];
    const actionFeed = dashboard?.action_feed ?? [];
    const brokerageWorkloads = dashboard?.workloads ?? [];
    const recordsSummary = dashboard?.records_summary;
    const analytics = dashboard?.analytics;

    // Derived analytics values
    const volumeMax = analytics ? Math.max(...analytics.monthly_volume.months.map(m => m.total), 1) : 1;
    const importsPercentage = analytics?.transaction_flow.total ? (analytics.transaction_flow.imports / analytics.transaction_flow.total) * 100 : 0;
    const exportsPercentage = analytics?.transaction_flow.total ? (analytics.transaction_flow.exports / analytics.transaction_flow.total) * 100 : 0;
    const completionRate = analytics?.transaction_flow.completion_rate ?? 0;
    const completedVolume = analytics?.transaction_flow.completed ?? 0;
    const liveStatusTotal = analytics?.status_breakdown.reduce((acc, curr) => acc + curr.value, 0) ?? 0;
    const overdueTransactions = analytics?.overdue_transactions;

    const overdueCards: Array<{
        key: 'imports' | 'exports';
        label: string;
        icon: IconName;
        accentTextClass: string;
        accentSurfaceClass: string;
        accentBarClass: string;
    }> = [
        {
            key: 'imports',
            label: 'Import Overdue',
            icon: 'download',
            accentTextClass: 'text-blue-500',
            accentSurfaceClass: 'bg-blue-500/10',
            accentBarClass: 'bg-blue-500/85',
        },
        {
            key: 'exports',
            label: 'Export Overdue',
            icon: 'truck',
            accentTextClass: 'text-emerald-500',
            accentSurfaceClass: 'bg-emerald-500/10',
            accentBarClass: 'bg-emerald-500/85',
        },
    ];

    const recordsTiles = [
        {
            label: 'Ready for Archive',
            value: recordsSummary?.archive_ready_count ?? 0,
            valueClass: 'text-emerald-500',
        },
        {
            label: 'Missing Archive Docs',
            value: recordsSummary?.missing_docs_count ?? 0,
            valueClass: 'text-amber-500',
        },
        {
            label: 'Completed in Review',
            value: recordsSummary?.completed_count ?? 0,
            valueClass: 'text-text-primary',
        },
        {
            label: 'Cancelled in Review',
            value: recordsSummary?.cancelled_count ?? 0,
            valueClass: 'text-red-500',
        },
    ];


    const statusColors = {
        pending: '#ff9f0a',
        in_progress: '#0a84ff',
        completed: '#30d158',
        cancelled: '#ff453a',
    };

    return (
        <div className="relative min-h-screen w-full pb-16 pt-8">
            {/* Vercel-style subtle grid background - Fixed to viewport so scrolling is smooth */}
            <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_50%,#000_60%,transparent_100%)]" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Section 1: Dashboard Header */}
                <header className="mb-8">
                    <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
                    <p className="mt-1 text-sm text-text-secondary">Overview of active brokerage operations and metrics.</p>
                </header>

                {/* Section 2: KPI Cards */}
                <section className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    {kpiCards.map((card) => (
                        <div
                            key={card.label}
                            className="group flex flex-col relative overflow-hidden rounded-2xl border border-border/40 bg-surface/40 p-5 shadow-sm backdrop-blur-xl transition-all hover:border-border hover:bg-surface/80 hover:shadow-md"
                        >
                            <div className="flex items-start justify-between min-h-[32px]">
                                <span className="text-[10px] font-bold uppercase leading-relaxed tracking-[0.2em] text-text-muted pr-2">{card.label}</span>
                                {/* Sparkline visualization */}
                                <div className="flex shrink-0 items-end gap-[3px] opacity-20 transition-opacity group-hover:opacity-40" style={{ color: card.color }}>
                                    <div className="h-1.5 w-1 rounded-full bg-current" />
                                    <div className="h-2.5 w-1 rounded-full bg-current" />
                                    <div className="h-2 w-1 rounded-full bg-current" />
                                    <div className="h-4 w-1 rounded-full bg-current" />
                                    <div className="h-3 w-1 rounded-full bg-current" />
                                </div>
                            </div>
                            <div className="mt-auto pt-4 flex items-end justify-between">
                                <p className="text-4xl font-light tabular-nums tracking-tighter text-text-primary">{card.value}</p>
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface" style={{ color: card.color }}>
                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ))}
                </section>

                {/* Section 3: Visual Analytics Row */}
                <section className="mb-6 grid gap-6 lg:grid-cols-3">
                    {/* 3.1 Monthly Volume */}
                    <div className="flex flex-col rounded-2xl border border-border/40 bg-surface/40 p-5 backdrop-blur-xl">
                        <h2 className="mb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted">Monthly Volume</h2>
                        <div className="mb-6 flex items-baseline gap-2">
                            <span className="text-2xl font-light tabular-nums tracking-tight text-text-primary">{analytics?.monthly_volume.total ?? '—'}</span>
                            <span className="text-[11px] font-medium text-text-secondary">YTD Transactions</span>
                        </div>
                        <div className="mt-auto flex h-32 items-end justify-between gap-1">
                            {analytics ? analytics.monthly_volume.months.map((month) => (
                                <div key={month.month} className="group relative flex h-full w-full flex-col justify-end">
                                    <div className="flex h-full w-full flex-col justify-end gap-[1px]">
                                        <div 
                                            className="w-full rounded-[2px] bg-blue-500/80 transition-all group-hover:bg-blue-400" 
                                            style={{ height: `${(month.imports / volumeMax) * 100}%`, minHeight: month.imports > 0 ? '4px' : '0' }}
                                        />
                                        <div 
                                            className="w-full rounded-[2px] bg-emerald-500/80 transition-all group-hover:bg-emerald-400" 
                                            style={{ height: `${(month.exports / volumeMax) * 100}%`, minHeight: month.exports > 0 ? '4px' : '0' }}
                                        />
                                    </div>
                                    <span className="mt-2 text-center text-[9px] font-medium text-text-muted">{monthNames[month.month - 1]}</span>
                                    
                                    {/* Tooltip */}
                                    <div className="absolute -top-10 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded border border-border bg-surface px-2 py-1 text-[10px] shadow-lg group-hover:block z-10">
                                        <span className="text-blue-500 font-medium">{month.imports}</span> / <span className="text-emerald-500 font-medium">{month.exports}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="flex h-full w-full items-center justify-center text-[12px] text-text-muted">Loading chart...</div>
                            )}
                        </div>
                    </div>

                    {/* 3.2 Transaction Distribution */}
                    <div className="flex flex-col rounded-2xl border border-border/40 bg-surface/40 p-5 backdrop-blur-xl">
                        <h2 className="mb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted">Transaction Distribution</h2>
                        <div className="mb-6 flex items-baseline gap-2">
                            <span className="text-2xl font-light tabular-nums tracking-tight text-text-primary">{analytics?.transaction_flow.total ?? '—'}</span>
                            <span className="text-[11px] font-medium text-text-secondary">YTD Volume</span>
                        </div>
                        
                        <div className="mt-auto space-y-5">
                            <div>
                                <div className="mb-1.5 flex justify-between text-[11px] font-medium">
                                    <span className="text-text-secondary">Imports</span>
                                    <span className="text-text-primary">{analytics?.transaction_flow.imports ?? '—'}</span>
                                </div>
                                <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface">
                                    <div className="bg-blue-500/80 transition-all" style={{ width: `${importsPercentage}%` }} />
                                </div>
                            </div>

                            <div>
                                <div className="mb-1.5 flex justify-between text-[11px] font-medium">
                                    <span className="text-text-secondary">Exports</span>
                                    <span className="text-text-primary">{analytics?.transaction_flow.exports ?? '—'}</span>
                                </div>
                                <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface">
                                    <div className="bg-emerald-500/80 transition-all" style={{ width: `${exportsPercentage}%` }} />
                                </div>
                            </div>
                            
                            <div>
                                <div className="mb-1.5 flex justify-between text-[11px] font-medium">
                                    <span className="text-text-secondary">Completion Rate</span>
                                    <span className="text-text-primary">
                                        {completionRate}% · {completedVolume} completed
                                    </span>
                                </div>
                                <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface">
                                    <div className="bg-emerald-500/80 transition-all" style={{ width: `${completionRate}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3.3 Live Status Breakdown */}
                    <div className="flex flex-col rounded-2xl border border-border/40 bg-surface/40 p-5 backdrop-blur-xl">
                        <h2 className="mb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted">Live Status Mix</h2>
                        <div className="mb-6 flex items-baseline gap-2">
                            <span className="text-2xl font-light tabular-nums tracking-tight text-text-primary">
                                {liveStatusTotal || '—'}
                            </span>
                            <span className="text-[11px] font-medium text-text-secondary">Live Transactions</span>
                        </div>
                        
                        <div className="mt-auto">
                            <div className="mb-4 flex h-3 w-full overflow-hidden rounded-full bg-surface">
                                {analytics?.status_breakdown.map(status => {
                                    const percentage = liveStatusTotal > 0 ? (status.value / liveStatusTotal) * 100 : 0;
                                    return (
                                        <div 
                                            key={status.key} 
                                            style={{ width: `${percentage}%`, backgroundColor: statusColors[status.key] }} 
                                            className="h-full transition-all hover:opacity-80"
                                            title={`${status.label}: ${status.value}`}
                                        />
                                    );
                                })}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                                {analytics?.status_breakdown.map(status => (
                                    <div key={status.key} className="flex items-center justify-between text-[11px]">
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColors[status.key] }} />
                                            <span className="text-text-secondary">{status.label}</span>
                                        </div>
                                        <span className="font-medium tabular-nums text-text-primary">{status.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 4: Secondary Metrics */}
                <section className="mb-12 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="overflow-hidden rounded-[28px] border border-border/40 bg-surface/45 shadow-sm backdrop-blur-xl">
                        <div className="flex items-start justify-between border-b border-border/40 px-5 py-4">
                            <div>
                                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted">Overdue Transactions</h2>
                                <p className="mt-1 text-[12px] text-text-secondary">Active records beyond the update threshold and needing follow-up.</p>
                            </div>
                            <span className="rounded-full border border-border/50 bg-surface/70 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-text-secondary">
                                {overdueTransactions?.threshold_hours ?? 48}+h without update
                            </span>
                        </div>

                        <div className="grid gap-4 p-5">
                            <div className="rounded-2xl border border-border/50 bg-surface/35 p-4 shadow-sm">
                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">Overdue Queue Size</p>
                                <div className="mt-3 flex items-end gap-2">
                                    <span className="text-4xl font-light tabular-nums tracking-tight text-text-primary">{overdueTransactions?.total ?? '—'}</span>
                                    <span className="pb-1 text-[12px] font-medium uppercase tracking-[0.12em] text-text-muted">flagged records</span>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {overdueCards.map((card) => {
                                    const stats = overdueTransactions?.[card.key];
                                    const overdueCount = stats?.overdue_count ?? 0;
                                    const barWidth = overdueTransactions?.total
                                        ? Math.max((overdueCount / overdueTransactions.total) * 100, overdueCount > 0 ? 12 : 0)
                                        : 0;

                                    return (
                                        <div key={card.key} className="rounded-2xl border border-border/50 bg-surface/35 p-4 shadow-sm">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.accentSurfaceClass} ${card.accentTextClass}`}>
                                                        <Icon name={card.icon} className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-primary">{card.label}</p>
                                                        <p className="mt-0.5 text-[11px] text-text-secondary">No staff update past SLA threshold.</p>
                                                    </div>
                                                </div>
                                                <span className="rounded-md border border-border/50 bg-surface px-2 py-1 text-[10px] font-medium text-text-secondary shadow-sm">
                                                    oldest: {stats?.oldest_hours ?? '—'}h
                                                </span>
                                            </div>

                                            <div className="mb-4 mt-6 flex items-end gap-2">
                                                <span className="text-4xl font-light tabular-nums tracking-tight text-text-primary">
                                                    {overdueCount}
                                                </span>
                                                <span className="pb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-text-muted">overdue records</span>
                                            </div>

                                            <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-surface shadow-inner">
                                                <div
                                                    className={`h-full rounded-full ${card.accentBarClass} transition-all duration-1000`}
                                                    style={{ width: `${barWidth}%` }}
                                                />
                                            </div>

                                            <div className="mt-auto flex justify-between border-t border-border/40 pt-4 text-[11px] text-text-secondary">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted">48-72h</span>
                                                    <span className="font-medium text-text-primary">{stats?.stale_48_72_count ?? 0}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted">72h+</span>
                                                    <span className="font-medium text-text-primary">{stats?.stale_over_72_count ?? 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-[28px] border border-border/40 bg-surface/45 shadow-sm backdrop-blur-xl flex flex-col">
                        <div className="flex items-start justify-between border-b border-border/40 px-5 py-4">
                            <div>
                                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted">Records &amp; Archive</h2>
                                <p className="mt-1 text-[12px] text-text-secondary">Post-operations archive readiness and review load.</p>
                            </div>
                            <span className="rounded-full border border-border/50 bg-surface/70 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-text-secondary">
                                Post-Operations
                            </span>
                        </div>

                        <div className="flex flex-col bg-surface/10 h-full">
                            <div className="flex items-end justify-between border-b border-border/40 p-6 transition-colors hover:bg-surface/30">
                                <div>
                                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">Records In Review</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-light tabular-nums tracking-tighter text-text-primary">{recordsSummary?.in_review_count ?? '—'}</span>
                                        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-muted">queue size</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 h-full">
                                {recordsTiles.map((tile, i) => (
                                    <div 
                                        key={tile.label} 
                                        className={`flex flex-col justify-center p-5 transition-colors hover:bg-surface/30 border-border/40 ${i % 2 !== 0 ? 'border-l' : ''} ${i > 1 ? 'border-t' : ''}`}
                                    >
                                        <p className="mb-2 text-[11px] font-medium text-text-secondary">{tile.label}</p>
                                        <p className={`text-2xl font-light tabular-nums tracking-tight ${tile.valueClass}`}>{tile.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 5: Operational Workspace */}
                <main className="grid gap-6 xl:grid-cols-12 items-start">
                    {/* Left Column */}
                    <div className="flex flex-col gap-6 xl:col-span-8 h-full">
                        {/* Quick Actions */}
                        <section>
                            <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted">Modules</h2>
                            <div className="grid gap-3 sm:grid-cols-3">
                                {quickActions.map((action) => (
                                    <button
                                        key={action.label}
                                        type="button"
                                        onClick={() => navigate(action.path)}
                                        className="group flex items-center gap-3 rounded-xl border border-border/50 bg-surface/30 p-3 transition-all hover:border-border hover:bg-surface/80 hover:shadow-sm"
                                    >
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-surface shadow-sm transition-transform group-hover:scale-105">
                                            <Icon name={action.icon} className="h-3.5 w-3.5 text-text-secondary transition-colors group-hover:text-text-primary" />
                                        </div>
                                        <span className="text-[13px] font-medium text-text-secondary transition-colors group-hover:text-text-primary">
                                            {action.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Operation Queue */}
                        <section>
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted">Operation Queue</h2>
                                {criticalOperations.length > 0 && (
                                    <span className="rounded-full border border-border/50 bg-surface px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                                        {criticalOperations.length} items
                                    </span>
                                )}
                            </div>
                            <div className={`flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-surface/40 backdrop-blur-xl ${criticalOperations.length === 0 ? 'min-h-[250px]' : ''}`}>
                                {criticalOperations.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center">
                                        <EmptyState title="All clear — no critical issues." body="Stale records, missing archive documents, and flagged exceptions will appear here." />
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/40">
                                        {criticalOperations.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => navigate(dashboardDestinationPaths[item.destination])}
                                                className="group flex w-full flex-col gap-2 p-4 text-left transition-colors hover:bg-surface sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                <div className="flex items-start gap-4 sm:items-center">
                                                    <div className="mt-1 flex sm:mt-0">
                                                        {item.status === 'stuck' ? (
                                                            <Icon name="alert-circle" className="h-4 w-4 text-red-500" />
                                                        ) : item.status === 'missing' ? (
                                                            <Icon name="file-text" className="h-4 w-4 text-amber-500" />
                                                        ) : (
                                                            <Icon name="clock" className="h-4 w-4 text-blue-500" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[14px] font-medium text-text-primary">{item.ref}</span>
                                                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                                                item.status === 'stuck' ? 'border-red-500/20 text-red-500 bg-red-500/5' :
                                                                item.status === 'missing' ? 'border-amber-500/20 text-amber-500 bg-amber-500/5' :
                                                                'border-border text-text-secondary bg-surface/50'
                                                            }`}>
                                                                {statusLabels[item.status]}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-[13px] text-text-secondary group-hover:text-text-primary transition-colors">{item.title}</p>
                                                    </div>
                                                </div>
                                                <div className="pl-8 sm:pl-0">
                                                    <span className="text-[11px] font-mono text-text-muted">{item.age}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column */}
                    <aside className="flex flex-col gap-6 xl:col-span-4 h-full">
                        {/* Workload Distribution */}
                        <section>
                            <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted">Encoder Workload</h2>
                            <div className="overflow-hidden rounded-2xl border border-border/40 bg-surface/40 backdrop-blur-xl">
                                {brokerageWorkloads.length === 0 ? (
                                    <EmptyState title="No encoder workloads yet." body="Active brokerage assignments will appear here." />
                                ) : (
                                    <div className="divide-y divide-border/40 p-1">
                                        {brokerageWorkloads.map((person) => (
                                            <div key={person.id} className="flex items-center justify-between gap-3 rounded-xl p-3 transition-colors hover:bg-surface">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-surface shadow-sm text-xs font-medium text-text-primary">
                                                        {person.name.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-[13px] font-medium text-text-primary">{person.name}</p>
                                                        <p className="text-[11px] text-text-muted">{person.role}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 text-right">
                                                    {person.overdue > 0 && (
                                                        <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-500">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                                            {person.overdue} late
                                                        </span>
                                                    )}
                                                    <span className="text-[13px] font-medium tabular-nums text-text-primary">{person.active}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Action Feed */}
                        <section>
                            <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted">Audit Log</h2>
                            <div className={`flex flex-col overflow-hidden rounded-2xl border border-border/40 bg-surface/40 backdrop-blur-xl ${actionFeed.length === 0 ? 'min-h-[250px]' : ''}`}>
                                {actionFeed.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center">
                                        <EmptyState title="No admin activity recorded yet." body="Status overrides, reassignments, and document alerts will show here." />
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/40">
                                        {actionFeed.map((item) => (
                                            <div key={item.id} className="flex gap-4 p-4 transition-colors hover:bg-surface">
                                                <div className="mt-0.5 shrink-0 text-text-muted">
                                                    {item.action === 'Document Alert' ? (
                                                        <Icon name="file-text" className="h-3.5 w-3.5 text-amber-500" />
                                                    ) : (
                                                        <Icon name="edit" className="h-3.5 w-3.5" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[13px] text-text-secondary leading-snug">
                                                        <span className="font-medium text-text-primary">{item.actor}</span>{' '}
                                                        {actionLeadIn(item.action)}{' '}
                                                        <span className="font-medium text-text-primary">{item.target}</span>
                                                    </p>
                                                    <p className="mt-0.5 truncate text-[12px] text-text-muted">{item.detail}</p>
                                                    <p className="mt-1.5 text-[10px] font-mono text-text-muted opacity-60">{item.age}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </aside>
                </main>
            </div>
        </div>
    );
};
