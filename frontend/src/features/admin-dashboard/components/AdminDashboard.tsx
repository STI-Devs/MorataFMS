import { CurrentDateTime } from '../../../components/CurrentDateTime';
import { Icon, type IconName } from '../../../components/Icon';
import { appRoutes } from '../../../lib/appRoutes';
import { useNavigate } from 'react-router-dom';

type KpiCard = {
    label: string;
    value: string;
    tone: 'neutral' | 'warning' | 'danger';
    helper: string;
};

type CriticalItem = {
    id: number;
    ref: string;
    status: 'stuck' | 'missing' | 'review';
    title: string;
    detail: string;
    age: string;
    path: string;
};

type FeedItem = {
    id: number;
    age: string;
    actor: string;
    action: string;
    target: string;
    detail: string;
};

type WorkloadItem = {
    id: number;
    name: string;
    role: string;
    active: number;
    overdue: number;
};

type QuickAction = {
    label: string;
    path: string;
    icon: IconName;
    accent: string;
};

const kpiCards: KpiCard[] = [
    {
        label: 'Active Imports',
        value: '18',
        tone: 'neutral',
        helper: 'Brokerage files still in progress',
    },
    {
        label: 'Active Exports',
        value: '11',
        tone: 'neutral',
        helper: 'Outbound shipments in motion',
    },
    {
        label: 'Delayed Shipments',
        value: '3',
        tone: 'danger',
        helper: 'Escalations needing admin action',
    },
    {
        label: 'Missing Final Docs',
        value: '6',
        tone: 'warning',
        helper: 'Finalized files still incomplete',
    },
];

const criticalOperations: CriticalItem[] = [
    {
        id: 1,
        ref: 'IMP-0921',
        status: 'stuck',
        title: 'Releasing delayed at customs hold',
        detail: 'Assigned to Sarah Velasco. No movement in the last 2 hours.',
        age: '2h ago',
        path: appRoutes.transactions,
    },
    {
        id: 2,
        ref: 'EXP-1044',
        status: 'missing',
        title: 'Final BL still missing — blocked for archive',
        detail: 'Shipment is completed but the final BL is not uploaded. Open Document Review.',
        age: '4h ago',
        path: appRoutes.adminDocumentReview,
    },
    {
        id: 3,
        ref: 'IMP-0918',
        status: 'review',
        title: 'Cancelled transaction waiting for admin review',
        detail: 'Client cancellation logged. Files need verification before archive handoff.',
        age: '1d ago',
        path: appRoutes.adminDocumentReview,
    },
];

const actionFeed: FeedItem[] = [
    {
        id: 1,
        age: '10 mins ago',
        actor: 'Admin',
        action: 'Status Override',
        target: 'IMP-0901',
        detail: 'Moved the shipment to Completed after manual review.',
    },
    {
        id: 2,
        age: '1h ago',
        actor: 'Admin',
        action: 'Reassignment',
        target: 'EXP-1042',
        detail: 'Transferred the case from Mike Tan to Sarah Velasco.',
    },
    {
        id: 3,
        age: '3h ago',
        actor: 'System',
        action: 'Document Alert',
        target: 'EXP-1038',
        detail: 'CO uploaded without the matching BL attachment.',
    },
];

const brokerageWorkloads: WorkloadItem[] = [
    {
        id: 1,
        name: 'Sarah Velasco',
        role: 'Senior Encoder',
        active: 12,
        overdue: 2,
    },
    {
        id: 2,
        name: 'Mike Tan',
        role: 'Encoder',
        active: 9,
        overdue: 1,
    },
    {
        id: 3,
        name: 'Jane Dela Cruz',
        role: 'Encoder',
        active: 7,
        overdue: 0,
    },
    {
        id: 4,
        name: 'Paolo Reyes',
        role: 'Encoder',
        active: 5,
        overdue: 0,
    },
];

const quickActions: QuickAction[] = [
    {
        label: 'Document Review',
        path: appRoutes.adminDocumentReview,
        icon: 'file-text',
        accent: '#0a84ff',
    },
    {
        label: 'Transaction Oversight',
        path: appRoutes.transactions,
        icon: 'archive',
        accent: '#30d158',
    },
    {
        label: 'Live Tracking',
        path: appRoutes.liveTracking,
        icon: 'clock',
        accent: '#64d2ff',
    },
    {
        label: 'Reports & Analytics',
        path: appRoutes.reports,
        icon: 'flag',
        accent: '#ff9f0a',
    },
    {
        label: 'User Management',
        path: appRoutes.users,
        icon: 'user',
        accent: '#bf5af2',
    },
    {
        label: 'Client Management',
        path: appRoutes.clients,
        icon: 'truck',
        accent: '#30d158',
    },
];

const toneStyles: Record<KpiCard['tone'], { value: string; dot: string }> = {
    neutral: {
        value: 'text-text-primary',
        dot: 'bg-blue-500',
    },
    warning: {
        value: 'text-amber-500',
        dot: 'bg-amber-500',
    },
    danger: {
        value: 'text-red-500',
        dot: 'bg-red-500',
    },
};

const statusBadgeStyles: Record<CriticalItem['status'], string> = {
    stuck: 'border-red-500/20 bg-red-500/10 text-red-500',
    missing: 'border-amber-500/20 bg-amber-500/10 text-amber-500',
    review: 'border-border bg-surface-secondary text-text-secondary',
};

const statusLabels: Record<CriticalItem['status'], string> = {
    stuck: 'Stuck',
    missing: 'Missing',
    review: 'Review',
};

const SectionHeading = ({ label, accentClass }: { label: string; accentClass: string }) => (
    <div className="mb-4 flex items-center gap-3">
        <div className={`h-5 w-1 rounded-full ${accentClass}`} />
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-text-secondary">{label}</h2>
    </div>
);

const EmptyState = ({ title, body }: { title: string; body: string }) => (
    <div className="px-6 py-10 text-center">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="mt-1 text-sm text-text-secondary">{body}</p>
    </div>
);

export const AdminDashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-8 px-6 py-6">
            <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-text-muted">System Oversight</p>
                    <h1 className="mt-2 text-4xl font-bold tracking-tight text-text-primary">Brokerage Dashboard</h1>
                    <p className="mt-3 max-w-2xl text-sm text-text-secondary">
                        Monitor today&apos;s brokerage workload, priority issues, and the admin actions that matter most.
                    </p>
                </div>
                <CurrentDateTime
                    className="text-left sm:text-right"
                    timeClassName="text-2xl font-mono font-bold tracking-tight text-text-primary"
                    dateClassName="mt-1 text-xs font-mono uppercase tracking-[0.25em] text-text-secondary"
                />
            </header>

            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {kpiCards.map((card) => {
                    const tone = toneStyles[card.tone];

                    return (
                        <article
                            key={card.label}
                            className="relative overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-sm"
                        >
                            <div className={`absolute right-4 top-4 h-2.5 w-2.5 rounded-full ${tone.dot}`} />
                            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">{card.label}</p>
                            <p className={`mt-5 text-5xl font-bold tracking-tighter ${tone.value}`}>{card.value}</p>
                            <p className="mt-3 text-sm text-text-secondary">{card.helper}</p>
                        </article>
                    );
                })}
            </section>

            <main className="grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
                <div className="space-y-8">
                    <section>
                        <SectionHeading label="Critical Operations" accentClass="bg-red-500" />
                        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
                            {criticalOperations.length === 0 ? (
                                <EmptyState
                                    title="All clear — no critical issues."
                                    body="Stuck shipments, missing archive documents, and flagged exceptions will appear here."
                                />
                            ) : (
                                criticalOperations.map((item, index) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => navigate(item.path)}
                                        className={`flex w-full items-start gap-4 px-5 py-5 text-left transition-colors hover:bg-hover ${
                                            index !== criticalOperations.length - 1 ? 'border-b border-border' : ''
                                        }`}
                                    >
                                        <span className={`mt-0.5 inline-flex rounded-md border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${statusBadgeStyles[item.status]}`}>
                                            {statusLabels[item.status]}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-baseline gap-2">
                                                <span className="text-xl font-bold tracking-tight text-text-primary">{item.ref}</span>
                                                <span className="text-sm text-text-muted">{item.title}</span>
                                            </div>
                                            <p className="mt-2 text-sm text-text-secondary">{item.detail}</p>
                                        </div>
                                        <div className="flex items-center gap-3 pl-4 text-text-muted">
                                            <span className="whitespace-nowrap text-xs font-mono uppercase tracking-[0.18em]">{item.age}</span>
                                            <Icon name="chevron-right" className="h-4 w-4" />
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </section>

                    <section>
                        <SectionHeading label="Action Feed" accentClass="bg-blue-500" />
                        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
                            {actionFeed.length === 0 ? (
                                <EmptyState
                                    title="No admin activity recorded yet."
                                    body="Status overrides, reassignments, and document alerts will show here."
                                />
                            ) : (
                                actionFeed.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className={`grid gap-3 px-5 py-4 md:grid-cols-[120px_minmax(0,1fr)] ${
                                            index !== actionFeed.length - 1 ? 'border-b border-border' : ''
                                        }`}
                                    >
                                        <p className="pt-0.5 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">{item.age}</p>
                                        <div>
                                            <p className="text-sm leading-6 text-text-secondary">
                                                <span className="font-semibold text-text-primary">{item.actor}</span>{' '}
                                                executed{' '}
                                                <span className="font-semibold text-blue-500">{item.action}</span>{' '}
                                                on{' '}
                                                <span className="font-semibold text-text-primary">{item.target}</span>
                                            </p>
                                            <p className="mt-1 text-sm text-text-muted">{item.detail}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                <aside className="space-y-8">
                    <section>
                        <SectionHeading label="Quick Actions" accentClass="bg-blue-500" />
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                            {quickActions.map((action) => (
                                <button
                                    key={action.label}
                                    type="button"
                                    onClick={() => navigate(action.path)}
                                    className="group relative min-h-[104px] rounded-xl border border-border bg-surface p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-border-strong hover:bg-hover"
                                >
                                    <div
                                        className="absolute inset-y-0 left-0 w-1 rounded-l-xl opacity-0 transition-opacity group-hover:opacity-100"
                                        style={{ backgroundColor: action.accent }}
                                    />
                                    <div
                                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                                        style={{ backgroundColor: `${action.accent}18` }}
                                    >
                                        <Icon name={action.icon} className="h-4 w-4" style={{ color: action.accent }} />
                                    </div>
                                    <p className="mt-4 whitespace-normal text-sm font-semibold leading-5 text-text-primary">
                                        {action.label}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section>
                        <SectionHeading label="Active Workloads" accentClass="bg-emerald-500" />
                        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
                            {brokerageWorkloads.map((person, index) => (
                                <div
                                    key={person.id}
                                    className={`flex items-center justify-between gap-4 px-5 py-4 ${
                                        index !== brokerageWorkloads.length - 1 ? 'border-b border-border' : ''
                                    }`}
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-text-primary">{person.name}</p>
                                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-text-muted">{person.role}</p>
                                        <p className="mt-2 text-sm text-text-secondary">{person.active} active files</p>
                                    </div>
                                    {person.overdue > 0 ? (
                                        <span className="rounded-md border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.18em] text-red-500">
                                            {person.overdue} late
                                        </span>
                                    ) : (
                                        <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-500">
                                            On Track
                                        </span>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => navigate(appRoutes.transactions)}
                                className="w-full border-t border-border px-5 py-3 text-sm font-semibold text-blue-500 transition-colors hover:bg-hover"
                            >
                                Open Transaction Oversight
                            </button>
                        </div>
                    </section>
                </aside>
            </main>
        </div>
    );
};
