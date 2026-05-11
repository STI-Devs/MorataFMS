import { useNavigate } from 'react-router-dom';
import { CurrentDateTime } from '../../../components/CurrentDateTime';
import { Icon, type IconName } from '../../../components/Icon';
import { appRoutes } from '../../../lib/appRoutes';
import { useEncoderDashboard } from '../hooks/useEncoderDashboard';
import type { EncoderDashboardAttentionItem, EncoderDashboardMonthlyVolumePoint } from '../types/encoderDashboard.types';

type KpiCard = {
    label: string;
    value: string | number;
    helper: string;
    tone: 'neutral' | 'warning' | 'danger';
    icon: IconName;
};

const statusStyles: Record<EncoderDashboardAttentionItem['status'], string> = {
    needs_update: 'border-red-500/20 bg-red-500/10 text-red-500',
    remark: 'border-amber-500/20 bg-amber-500/10 text-amber-500',
    missing: 'border-blue-500/20 bg-blue-500/10 text-blue-500',
};

const statusLabels: Record<EncoderDashboardAttentionItem['status'], string> = {
    needs_update: 'Needs Update',
    remark: 'Open Remark',
    missing: 'Missing',
};

const typeStyles: Record<EncoderDashboardAttentionItem['type'], string> = {
    import: 'border-blue-500/20 bg-blue-500/10 text-blue-500',
    export: 'border-amber-500/20 bg-amber-500/10 text-amber-500',
};

const typeLabels: Record<EncoderDashboardAttentionItem['type'], string> = {
    import: 'Import',
    export: 'Export',
};

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

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MonthlyVolumePreview = ({ data }: { data: EncoderDashboardMonthlyVolumePoint[] }) => {
    const max = Math.max(...data.map((point) => point.total), 1);

    return (
        <div className="mt-4 flex h-32 w-full items-end gap-1.5">
            {data.map((point) => {
                const importsHeight = (point.imports / max) * 100;
                const exportsHeight = (point.exports / max) * 100;

                return (
                    <div key={point.month} className="flex flex-1 flex-col items-center gap-1">
                        <div className="flex h-28 w-full flex-col justify-end gap-0.5">
                            <div
                                className="w-full rounded-t-sm bg-blue-500 transition-all duration-500"
                                style={{ height: `${importsHeight}%`, minHeight: point.imports > 0 ? 4 : 0 }}
                                title={`Imports: ${point.imports}`}
                            />
                            <div
                                className="w-full rounded-b-sm bg-violet-500 transition-all duration-500"
                                style={{ height: `${exportsHeight}%`, minHeight: point.exports > 0 ? 4 : 0 }}
                                title={`Exports: ${point.exports}`}
                            />
                        </div>
                        <span className="text-[9px] font-medium text-text-muted">{MONTH_SHORT[point.month - 1]}</span>
                    </div>
                );
            })}
        </div>
    );
};

const previewMonthlyVolume = (data: EncoderDashboardMonthlyVolumePoint[], month: number) => {
    const currentMonthIndex = Math.min(Math.max(month, 1), 12);

    return data.slice(Math.max(currentMonthIndex - 6, 0), currentMonthIndex);
};

export const EncoderDashboard = () => {
    const navigate = useNavigate();
    const dashboardQuery = useEncoderDashboard();
    const dashboard = dashboardQuery.data;

    const kpis = dashboard?.kpis;
    const attentionItems = dashboard?.attention_items ?? [];
    const analytics = dashboard?.analytics;
    const reports = dashboard?.reports;
    const previewClients = reports?.client_volume.clients ?? [];
    const previewClientMax = Math.max(...previewClients.map((client) => client.total), 1);
    const previewVolume = reports ? previewMonthlyVolume(reports.monthly_volume.months, reports.month) : [];

    const kpiCards: KpiCard[] = [
        {
            label: 'My Imports',
            value: dashboardQuery.isLoading ? '—' : (kpis?.active_imports ?? 0),
            helper: 'Active imports assigned to you',
            tone: 'neutral',
            icon: 'truck',
        },
        {
            label: 'My Exports',
            value: dashboardQuery.isLoading ? '—' : (kpis?.active_exports ?? 0),
            helper: 'Active exports assigned to you',
            tone: 'neutral',
            icon: 'flag',
        },
        {
            label: 'ETA/ETD This Week',
            value: dashboardQuery.isLoading ? '—' : (kpis?.upcoming_eta_etd ?? 0),
            helper: 'Arrivals/departures within 7 days',
            tone: 'warning',
            icon: 'clock',
        },
        {
            label: 'Open Remarks',
            value: dashboardQuery.isLoading ? '—' : (kpis?.open_remarks ?? 0),
            helper: 'Unresolved remarks on your files',
            tone: 'warning',
            icon: 'alert-circle',
        },
        {
            label: 'No Update > 48h',
            value: dashboardQuery.isLoading ? '—' : (kpis?.needs_update ?? 0),
            helper: 'Your files with no recent activity',
            tone: 'danger',
            icon: 'bell',
        },
        {
            label: 'Document Gaps',
            value: dashboardQuery.isLoading ? '—' : (kpis?.document_gaps ?? 0),
            helper: 'Completed files missing docs',
            tone: 'danger',
            icon: 'file-text',
        },
    ];

    const emptyQueueState = dashboardQuery.isLoading
        ? { title: 'Loading operation queue...', body: 'Your stale files, remarks, and document gaps will appear here.' }
        : dashboardQuery.isError
            ? { title: 'Unable to load queue.', body: 'Refresh the page to retry.' }
            : { title: 'Queue clear.', body: 'No assigned issues right now.' };

    return (
        <div className="space-y-6 px-6 py-6 max-w-[1600px] mx-auto">
            <header className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-text-primary">Dashboard</h1>
                    <p className="mt-1 text-sm text-text-secondary">
                        Monitor your active workload, completed activity, and operation queue.
                    </p>
                </div>
                <CurrentDateTime
                    className="hidden text-right sm:block"
                    timeClassName="text-xl font-mono font-bold tracking-tight text-text-primary leading-none"
                    dateClassName="mt-1 text-xs font-mono uppercase tracking-[0.25em] text-text-secondary leading-none"
                />
            </header>

            <div className="grid gap-6 xl:grid-cols-2">
                {/* LEFT COLUMN: ASSIGNED TO YOU */}
                <div className="flex flex-col gap-6 rounded-[2rem] border-2 border-blue-500/10 bg-blue-500/[0.02] p-6 lg:p-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                            <Icon name="archive" className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500">Records Currently Assigned To You</h2>
                            <p className="text-sm font-medium text-text-secondary">Track your active obligations</p>
                        </div>
                    </div>

                    {/* Section: Current Workload */}
                    <section>
                        <h3 className="mb-4 text-base font-bold text-text-primary">Current Workload</h3>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {kpiCards.map((card) => {
                                const tone = toneStyles[card.tone];
                                return (
                                    <article key={card.label} className="flex flex-col rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm transition-shadow hover:shadow-md">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-text-muted leading-tight">{card.label}</p>
                                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${tone.surface}`}>
                                                <Icon name={card.icon} className="h-3.5 w-3.5" />
                                            </div>
                                        </div>
                                        <p className={`text-2xl font-black tracking-tighter ${tone.value}`}>{card.value}</p>
                                        <p className="mt-1 text-[10px] font-semibold text-text-secondary leading-tight">{card.helper}</p>
                                    </article>
                                );
                            })}
                        </div>
                    </section>

                    {/* Section: Operation Queue */}
                    <section className="flex-1 flex flex-col">
                        <h3 className="mb-4 text-base font-bold text-text-primary">Operation Queue</h3>
                        <div className="flex-1 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                            {attentionItems.length === 0 ? (
                                <EmptyState title={emptyQueueState.title} body={emptyQueueState.body} />
                            ) : (
                                <div className="max-h-[500px] overflow-y-auto">
                                    {attentionItems.map((item, index) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => navigate(appRoutes.trackingDetail.replace(':referenceId', encodeURIComponent(item.ref)))}
                                            className={`grid w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-hover sm:grid-cols-[85px_minmax(0,1fr)_80px] sm:items-center ${
                                                index !== attentionItems.length - 1 ? 'border-b border-border' : ''
                                            }`}
                                        >
                                            <div className="flex flex-col items-start gap-1.5">
                                                <span className={`inline-flex w-fit rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] ${statusStyles[item.status]}`}>
                                                    {statusLabels[item.status]}
                                                </span>
                                                <span className={`inline-flex min-w-[60px] items-center justify-center rounded-md border px-2 py-0.5 text-[10px] font-semibold leading-none ${typeStyles[item.type]}`}>
                                                    {typeLabels[item.type]}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black tracking-tight text-text-primary truncate">{item.ref}</span>
                                                    <span className="text-xs text-text-muted truncate">{item.title}</span>
                                                </div>
                                                <p className="mt-0.5 truncate text-xs text-text-secondary">{item.detail}</p>
                                            </div>
                                            <div className="flex items-center justify-end gap-1.5 text-text-muted">
                                                <span className="whitespace-nowrap text-[10px] font-mono uppercase tracking-widest">{item.age}</span>
                                                <Icon name="chevron-right" className="h-3 w-3" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* RIGHT COLUMN: COMPLETED BY YOU */}
                <div className="flex flex-col gap-6 rounded-[2rem] border-2 border-emerald-500/10 bg-emerald-500/[0.02] p-6 lg:p-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                            <Icon name="check-circle" className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Work Completed By You</h2>
                            <p className="text-sm font-medium text-text-secondary">Measure your operational output</p>
                        </div>
                    </div>

                    {/* Section: Monthly Output */}
                    <section>
                        <h3 className="mb-4 text-base font-bold text-text-primary">Monthly Output</h3>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm text-center">
                                <Icon name="check-circle" className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
                                <p className="text-3xl font-black text-text-primary">{dashboardQuery.isLoading ? '—' : (analytics?.activity.transactions_completed.this_month.total ?? 0)}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mt-1">Transactions Completed</p>
                                <p className="text-xs text-text-secondary mt-1">Assigned transactions closed this month</p>
                            </div>
                            <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm text-center">
                                <Icon name="file-text" className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
                                <p className="text-3xl font-black text-text-primary">{dashboardQuery.isLoading ? '—' : (analytics?.activity.documents_uploaded.this_month.total ?? 0)}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mt-1">Documents Added</p>
                                <p className="text-xs text-text-secondary mt-1">Files you attached this month</p>
                            </div>
                            <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm text-center">
                                <Icon name="archive" className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
                                <p className="text-3xl font-black text-text-primary">{dashboardQuery.isLoading ? '—' : (analytics?.activity.records_finalized.this_month.total ?? 0)}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mt-1">Records Finalized</p>
                                <p className="text-xs text-text-secondary mt-1">This Month</p>
                            </div>
                        </div>
                    </section>

                    <section className="flex-1">
                        <div className="mb-4 flex items-center justify-between gap-4">
                            <h3 className="text-base font-bold text-text-primary">Reports & Analytics</h3>
                            <button
                                type="button"
                                onClick={() => navigate(appRoutes.encoderReportsAnalytics)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 transition-colors hover:text-emerald-700"
                            >
                                View full
                                <Icon name="chevron-right" className="h-3 w-3" />
                            </button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <article className="flex min-h-[240px] flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <h4 className="text-sm font-bold text-text-primary">Volume Processed</h4>
                                    <div className="flex gap-2">
                                        <span className="flex items-center gap-1 text-[10px] font-medium text-text-muted">
                                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                            Imports
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] font-medium text-text-muted">
                                            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                                            Exports
                                        </span>
                                    </div>
                                </div>
                                {reports ? (
                                    <MonthlyVolumePreview data={previewVolume} />
                                ) : (
                                    <div className="flex flex-1 items-center justify-center text-sm text-text-muted">No data</div>
                                )}
                            </article>

                            <article className="flex min-h-[240px] flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm">
                                <h4 className="text-sm font-bold text-text-primary">Top Clients Handled</h4>
                                <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-2">
                                    {previewClients.slice(0, 4).map((client) => (
                                        <div key={client.client_id} className="space-y-1">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="truncate text-xs font-semibold text-text-secondary">{client.client_name}</span>
                                                <span className="text-xs font-black text-text-primary">{client.total}</span>
                                            </div>
                                            <div className="h-1.5 overflow-hidden rounded-full bg-border">
                                                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(client.total / previewClientMax) * 100}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                    {previewClients.length === 0 && (
                                        <div className="flex h-full items-center justify-center text-sm text-text-muted">No data</div>
                                    )}
                                </div>
                            </article>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
