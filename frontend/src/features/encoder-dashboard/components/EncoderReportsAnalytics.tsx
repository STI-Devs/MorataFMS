import { CurrentDateTime } from '../../../components/CurrentDateTime';
import { Icon } from '../../../components/Icon';
import { useEncoderDashboard } from '../hooks/useEncoderDashboard';
import type {
    EncoderDashboardClientVolumeItem,
    EncoderDashboardMonthlyVolumePoint,
    EncoderDashboardStageCompletionStats,
} from '../types/encoderDashboard.types';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const compactNumber = (value: number | undefined): string => String(value ?? 0);

const MonthlyVolumeChart = ({ data }: { data: EncoderDashboardMonthlyVolumePoint[] }) => {
    const max = Math.max(...data.map((point) => point.total), 1);

    return (
        <div className="overflow-x-auto pt-9">
            <div className="min-w-[520px] sm:min-w-0">
                <div className="mt-6 flex h-52 w-full items-end gap-2">
            {data.map((point) => {
                const importsHeight = (point.imports / max) * 100;
                const exportsHeight = (point.exports / max) * 100;

                return (
                    <div key={point.month} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex h-44 w-full flex-col justify-end gap-1">
                            <div
                                className="w-full rounded-t-md bg-chart-1 transition-all duration-500"
                                style={{ height: `${importsHeight}%`, minHeight: point.imports > 0 ? 6 : 0 }}
                                title={`Imports: ${point.imports}`}
                            />
                            <div
                                className="w-full rounded-b-md bg-chart-2 transition-all duration-500"
                                style={{ height: `${exportsHeight}%`, minHeight: point.exports > 0 ? 6 : 0 }}
                                title={`Exports: ${point.exports}`}
                            />
                        </div>
                        <span className="text-[10px] font-semibold text-text-muted">{MONTH_SHORT[point.month - 1]}</span>
                    </div>
                );
            })}
                </div>
            </div>
        </div>
    );
};

const ClientVolumeList = ({ clients }: { clients: EncoderDashboardClientVolumeItem[] }) => {
    const max = Math.max(...clients.map((client) => client.total), 1);

    if (clients.length === 0) {
        return <div className="flex min-h-[220px] items-center justify-center text-sm text-text-muted">No data</div>;
    }

    return (
        <div className="mt-5 space-y-4">
            {clients.slice(0, 8).map((client) => (
                <div key={client.client_id} className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-text-primary">{client.client_name}</p>
                            <p className="text-xs font-medium text-text-secondary">
                                {client.imports} imports / {client.exports} exports
                            </p>
                        </div>
                        <span className="text-lg font-black text-text-primary">{client.total}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-border">
                        <div className="h-full rounded-full bg-success" style={{ width: `${(client.total / max) * 100}%` }} />
                    </div>
                </div>
            ))}
        </div>
    );
};

const StageBreakdown = ({ title, stats }: { title: string; stats: EncoderDashboardStageCompletionStats | undefined }) => (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
            <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">{title}</p>
                <p className="mt-1 text-sm font-medium text-text-secondary">Stage completions this month</p>
            </div>
            <p className="text-3xl font-black text-text-primary">{compactNumber(stats?.total)}</p>
        </div>
        <div className="mt-5 space-y-2">
            {(stats?.stages ?? []).filter((stage) => stage.count > 0).slice(0, 5).map((stage) => (
                <div key={stage.key} className="flex items-center justify-between gap-3 rounded-xl bg-hover/60 px-3 py-2">
                    <span className="truncate text-xs font-semibold text-text-secondary">{stage.label}</span>
                    <span className="text-sm font-black text-text-primary">{stage.count}</span>
                </div>
            ))}
            {(stats?.stages ?? []).every((stage) => stage.count === 0) && (
                <p className="rounded-xl bg-hover/60 px-3 py-6 text-center text-sm text-text-muted">No stage completions yet.</p>
            )}
        </div>
    </div>
);

export const EncoderReportsAnalytics = () => {
    const dashboardQuery = useEncoderDashboard();
    const reports = dashboardQuery.data?.reports;
    const analytics = dashboardQuery.data?.analytics;
    const thisMonthActivity = analytics?.activity;

    return (
        <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-6">
            <header className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-text-primary">Reports & Analytics</h1>
                    <p className="mt-1 max-w-3xl text-sm text-text-secondary">
                        Review your assigned record volume, client distribution, turnaround, and completed activity.
                    </p>
                </div>
                <CurrentDateTime
                    className="hidden text-right sm:block"
                    timeClassName="text-xl font-mono font-bold tracking-tight text-text-primary leading-none"
                    dateClassName="mt-1 text-xs font-mono uppercase tracking-[0.25em] text-text-secondary leading-none"
                />
            </header>

            <section className="grid gap-4 md:grid-cols-3">
                <article className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">Transactions Completed</p>
                            <p className="mt-1 text-sm font-medium text-text-secondary">Assigned transactions closed this month</p>
                        </div>
                        <Icon name="check-circle" className="h-5 w-5 text-success" />
                    </div>
                    <p className="mt-5 text-4xl font-black text-text-primary">
                        {dashboardQuery.isLoading ? '—' : compactNumber(thisMonthActivity?.transactions_completed.this_month.total)}
                    </p>
                </article>
                <article className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">Documents Added</p>
                            <p className="mt-1 text-sm font-medium text-text-secondary">Files attached this month</p>
                        </div>
                        <Icon name="file-text" className="h-5 w-5 text-success" />
                    </div>
                    <p className="mt-5 text-4xl font-black text-text-primary">
                        {dashboardQuery.isLoading ? '—' : compactNumber(thisMonthActivity?.documents_uploaded.this_month.total)}
                    </p>
                </article>
                <article className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">Records Finalized</p>
                            <p className="mt-1 text-sm font-medium text-text-secondary">This month</p>
                        </div>
                        <Icon name="archive" className="h-5 w-5 text-success" />
                    </div>
                    <p className="mt-5 text-4xl font-black text-text-primary">
                        {dashboardQuery.isLoading ? '—' : compactNumber(thisMonthActivity?.records_finalized.this_month.total)}
                    </p>
                </article>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
                <article className="rounded-[2rem] border-2 border-primary/10 bg-primary/[0.02] p-6 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-lg font-black text-text-primary">Volume Processed</h2>
                            <p className="mt-1 text-sm font-medium text-text-secondary">
                                Assigned import/export records by month for {reports?.year ?? 'current year'}.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <span className="flex items-center gap-1 text-xs font-semibold text-text-muted"><span className="h-2 w-2 rounded-full bg-chart-1" />Imports</span>
                            <span className="flex items-center gap-1 text-xs font-semibold text-text-muted"><span className="h-2 w-2 rounded-full bg-chart-2" />Exports</span>
                        </div>
                    </div>
                    <MonthlyVolumeChart data={reports?.monthly_volume.months ?? []} />
                </article>

                <article className="rounded-[2rem] border-2 border-success/10 bg-success/[0.02] p-6 shadow-sm">
                    <h2 className="text-lg font-black text-text-primary">Top Clients Handled</h2>
                    <p className="mt-1 text-sm font-medium text-text-secondary">Current-month assigned record distribution.</p>
                    <ClientVolumeList clients={reports?.client_volume.clients ?? []} />
                </article>
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
                <article className="rounded-2xl border border-border bg-surface p-5 shadow-sm xl:col-span-1">
                    <h2 className="text-lg font-black text-text-primary">Turnaround Performance</h2>
                    <p className="mt-1 text-sm font-medium text-text-secondary">Average days from record creation to completion this month.</p>
                    <div className="mt-6 space-y-5">
                        <div>
                            <div className="mb-2 flex items-end justify-between">
                                <span className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">Imports</span>
                                <span className="text-xl font-black text-text-primary">{reports?.turnaround.imports.avg_days ?? '—'} <span className="text-xs font-medium text-text-muted">days avg</span></span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-border">
                                <div className="h-full rounded-full bg-chart-1" style={{ width: `${Math.min(((reports?.turnaround.imports.avg_days ?? 0) / 14) * 100, 100)}%` }} />
                            </div>
                        </div>
                        <div>
                            <div className="mb-2 flex items-end justify-between">
                                <span className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">Exports</span>
                                <span className="text-xl font-black text-text-primary">{reports?.turnaround.exports.avg_days ?? '—'} <span className="text-xs font-medium text-text-muted">days avg</span></span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-border">
                                <div className="h-full rounded-full bg-chart-2" style={{ width: `${Math.min(((reports?.turnaround.exports.avg_days ?? 0) / 14) * 100, 100)}%` }} />
                            </div>
                        </div>
                    </div>
                </article>

                <StageBreakdown title="Import Stage Output" stats={thisMonthActivity?.stages_completed.this_month.imports} />
                <StageBreakdown title="Export Stage Output" stats={thisMonthActivity?.stages_completed.this_month.exports} />
            </section>
        </div>
    );
};
