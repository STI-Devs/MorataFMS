import { useNavigate } from 'react-router-dom';
import { CurrentDateTime } from '../../../components/CurrentDateTime';
import { Icon, type IconName } from '../../../components/Icon';
import { appRoutes } from '../../../lib/appRoutes';
import { useEncoderDashboard } from '../hooks/useEncoderDashboard';
import type { EncoderDashboardAttentionItem } from '../types/encoderDashboard.types';

type KpiCard = {
    label: string;
    value: string;
    helper: string;
    tone: 'neutral' | 'warning' | 'danger';
    icon: IconName;
};

type QuickAction = {
    label: string;
    path: string;
    icon: IconName;
    helper: string;
};

const statusStyles: Record<EncoderDashboardAttentionItem['status'], string> = {
    needs_update: 'border-red-500/20 bg-red-500/10 text-red-500',
    remark: 'border-amber-500/20 bg-amber-500/10 text-amber-500',
    missing: 'border-blue-500/20 bg-blue-500/10 text-blue-500',
};

const statusLabels: Record<EncoderDashboardAttentionItem['status'], string> = {
    needs_update: 'Needs update',
    remark: 'Open remark',
    missing: 'Document gap',
};

const typeStyles: Record<EncoderDashboardAttentionItem['type'], string> = {
    import: 'border-blue-500/20 bg-blue-500/10 text-blue-500',
    export: 'border-amber-500/20 bg-amber-500/10 text-amber-500',
};

const typeLabels: Record<EncoderDashboardAttentionItem['type'], string> = {
    import: 'Import',
    export: 'Export',
};

const quickActions: QuickAction[] = [
    {
        label: 'Import List',
        path: appRoutes.imports,
        icon: 'truck',
        helper: 'Open assigned import files',
    },
    {
        label: 'Export List',
        path: appRoutes.exports,
        icon: 'flag',
        helper: 'Open assigned export files',
    },
    {
        label: 'Documents',
        path: appRoutes.documents,
        icon: 'file-text',
        helper: 'Upload and review files',
    },
    {
        label: 'Records',
        path: appRoutes.encoderRecordsArchive,
        icon: 'archive',
        helper: 'Archive and legacy folders',
    },
];

const toneStyles: Record<KpiCard['tone'], { value: string; surface: string }> = {
    neutral: {
        value: 'text-text-primary',
        surface: 'bg-blue-500/10 text-blue-500',
    },
    warning: {
        value: 'text-amber-500',
        surface: 'bg-amber-500/10 text-amber-500',
    },
    danger: {
        value: 'text-red-500',
        surface: 'bg-red-500/10 text-red-500',
    },
};

const EmptyState = ({ title, body }: { title: string; body: string }) => (
    <div className="px-6 py-10 text-center">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="mt-1 text-sm text-text-secondary">{body}</p>
    </div>
);

export const EncoderDashboard = () => {
    const navigate = useNavigate();
    const dashboardQuery = useEncoderDashboard();
    const dashboard = dashboardQuery.data;

    const kpiCards: KpiCard[] = [
        {
            label: 'My Imports',
            value: dashboardQuery.isLoading ? '—' : String(dashboard?.kpis.active_imports ?? 0),
            helper: 'Assigned active import records',
            tone: 'neutral',
            icon: 'truck',
        },
        {
            label: 'My Exports',
            value: dashboardQuery.isLoading ? '—' : String(dashboard?.kpis.active_exports ?? 0),
            helper: 'Assigned active export records',
            tone: 'neutral',
            icon: 'flag',
        },
        {
            label: 'ETA/ETD This Week',
            value: dashboardQuery.isLoading ? '—' : String(dashboard?.kpis.upcoming_eta_etd ?? 0),
            helper: 'Assigned arrivals/departures within 7 days',
            tone: 'warning',
            icon: 'clock',
        },
        {
            label: 'Open Remarks',
            value: dashboardQuery.isLoading ? '—' : String(dashboard?.kpis.open_remarks ?? 0),
            helper: 'Unresolved remarks on assigned files',
            tone: 'warning',
            icon: 'alert-circle',
        },
        {
            label: 'No Update in 48h',
            value: dashboardQuery.isLoading ? '—' : String(dashboard?.kpis.needs_update ?? 0),
            helper: 'Assigned active files with no recent activity',
            tone: 'danger',
            icon: 'bell',
        },
        {
            label: 'Document Gaps',
            value: dashboardQuery.isLoading ? '—' : String(dashboard?.kpis.document_gaps ?? 0),
            helper: 'Completed files missing final docs',
            tone: 'danger',
            icon: 'file-text',
        },
    ];

    const attentionItems = dashboard?.attention_items ?? [];
    const emptyState = dashboardQuery.isLoading
        ? {
            title: 'Loading assigned workload...',
            body: 'Your stale files, remarks, and document gaps will appear here.',
        }
        : dashboardQuery.isError
            ? {
                title: 'Unable to load your dashboard.',
                body: 'Refresh the page to retry the encoder dashboard request.',
            }
            : {
                title: 'No assigned issues right now.',
                body: 'Files needing update, remarks, or final documents will appear here.',
            };

    return (
        <div className="space-y-4 px-6 py-4">
            <header className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-text-primary">Assigned Brokerage Dashboard</h1>
                    <p className="mt-1 max-w-3xl text-sm text-text-secondary">
                        Track your assigned import/export workload, pending updates, remarks, and document gaps.
                    </p>
                </div>
                <CurrentDateTime
                    className="hidden text-right sm:block"
                    timeClassName="text-xl font-mono font-bold tracking-tight text-text-primary leading-none"
                    dateClassName="mt-1 text-xs font-mono uppercase tracking-[0.25em] text-text-secondary leading-none"
                />
            </header>

            <section className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
                {kpiCards.map((card) => {
                    const tone = toneStyles[card.tone];

                    return (
                        <article key={card.label} className="flex min-h-[152px] flex-col rounded-xl border border-border bg-surface px-4 py-3 shadow-sm">
                            <div className="flex min-h-[58px] items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-text-muted">{card.label}</p>
                                    <p className="mt-1 line-clamp-2 text-xs font-semibold text-text-secondary">{card.helper}</p>
                                </div>
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone.surface}`}>
                                    <Icon name={card.icon} className="h-4 w-4" />
                                </div>
                            </div>
                            <p className={`mt-auto pt-3 text-3xl font-black tracking-tighter ${tone.value}`}>{card.value}</p>
                        </article>
                    );
                })}
            </section>

            <main className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
                <section>
                    <div className="mb-2.5 flex items-center gap-2">
                        <div className="h-4 w-1 rounded-full bg-red-500" />
                        <h2 className="text-xs font-black uppercase tracking-[0.22em] text-text-secondary">My Operation Queue</h2>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
                        {attentionItems.length === 0 ? (
                            <EmptyState title={emptyState.title} body={emptyState.body} />
                        ) : (
                            attentionItems.map((item, index) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => navigate(appRoutes.trackingDetail.replace(':referenceId', encodeURIComponent(item.ref)))}
                                    className={`grid w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-hover sm:grid-cols-[92px_minmax(0,1fr)_80px] sm:items-center ${
                                        index !== attentionItems.length - 1 ? 'border-b border-border' : ''
                                    }`}
                                >
                                    <div className="flex flex-col items-start gap-1.5">
                                        <span className={`inline-flex min-h-[34px] min-w-[92px] items-center justify-center rounded-[16px] border px-2.5 text-center text-[10.5px] font-semibold leading-none whitespace-nowrap ${statusStyles[item.status]}`}>
                                            {statusLabels[item.status]}
                                        </span>
                                        <span className={`inline-flex min-h-[28px] min-w-[72px] items-center justify-center rounded-full border px-3 text-[11px] font-semibold leading-none ${typeStyles[item.type]}`}>
                                            {typeLabels[item.type]}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-baseline gap-2">
                                            <span className="text-base font-black tracking-tight text-text-primary">{item.ref}</span>
                                            <span className="text-sm text-text-muted">{item.title}</span>
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{item.detail}</p>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 text-text-muted">
                                        <span className="whitespace-nowrap text-xs font-mono uppercase tracking-[0.16em]">{item.age}</span>
                                        <Icon name="chevron-right" className="h-4 w-4" />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </section>

                <aside>
                    <div className="mb-2.5 flex items-center gap-2">
                        <div className="h-4 w-1 rounded-full bg-blue-500" />
                        <h2 className="text-xs font-black uppercase tracking-[0.22em] text-text-secondary">Quick Actions</h2>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        {quickActions.map((action) => (
                            <button
                                key={action.label}
                                type="button"
                                onClick={() => navigate(action.path)}
                                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-border-strong hover:bg-hover"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                                    <Icon name={action.icon} className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-text-primary">{action.label}</p>
                                    <p className="mt-0.5 truncate text-xs text-text-secondary">{action.helper}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>
            </main>
        </div>
    );
};
