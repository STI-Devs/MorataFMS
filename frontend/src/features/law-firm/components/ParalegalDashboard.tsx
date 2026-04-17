import { useNavigate } from 'react-router-dom';
import { CurrentDateTime } from '../../../components/CurrentDateTime';
import { appRoutes } from '../../../lib/appRoutes';

type ModuleCard = {
    label: string;
    description: string;
    path: string;
    accent: string;
    icon: string;
};

const moduleCards: ModuleCard[] = [
    {
        label: 'Files & Documents',
        description: 'Access the legal forms module and keep the paralegal workflow centered on the approved templates already in this app.',
        path: appRoutes.forms,
        accent: '#30d158',
        icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
    },
    {
        label: 'Documents',
        description: 'Enter the legal documents area without introducing mock counters or fake records before the backend resources are ready.',
        path: appRoutes.paralegalDocuments,
        accent: '#ff9f0a',
        icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2',
    },
];

export const ParalegalDashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-8 px-6 py-6">
            <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-text-muted">Legal Workspace</p>
                    <h1 className="mt-2 text-4xl font-bold tracking-tight text-text-primary">Paralegal Dashboard</h1>
                    <p className="mt-3 max-w-2xl text-sm text-text-secondary">
                        Use the new legal landing page to move between law-firm tools, forms, and documents while the backend implementation stays in progress.
                    </p>
                </div>
                <CurrentDateTime
                    className="text-left sm:text-right"
                    timeClassName="text-2xl font-mono font-bold tracking-tight text-text-primary"
                    dateClassName="mt-1 text-xs font-mono uppercase tracking-[0.25em] text-text-secondary"
                />
            </header>

            <section>
                <div className="mb-4 flex items-center gap-3">
                    <div className="h-5 w-1 rounded-full bg-blue-500" />
                    <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-text-secondary">Modules</h2>
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                    {moduleCards.map((card) => (
                        <button
                            key={card.label}
                            id={`paralegal-module-${card.label.toLowerCase().replace(/\s+/g, '-')}`}
                            type="button"
                            onClick={() => navigate(card.path)}
                            className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-xl border border-border bg-surface p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-border-strong hover:bg-hover hover:shadow-md"
                        >
                            <div
                                className="absolute inset-x-0 top-0 h-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                                style={{ backgroundColor: card.accent }}
                            />
                            <div
                                className="flex h-12 w-12 items-center justify-center rounded-xl"
                                style={{ backgroundColor: `${card.accent}18` }}
                            >
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    style={{ color: card.accent }}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d={card.icon} />
                                </svg>
                            </div>
                            <div>
                                <p className="text-base font-bold text-text-primary">{card.label}</p>
                                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{card.description}</p>
                            </div>
                            <div className="mt-auto flex items-center gap-1.5 text-xs font-semibold" style={{ color: card.accent }}>
                                Open module
                                <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            <section className="rounded-2xl border border-border bg-surface px-6 py-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-text-muted">Integration Status</p>
                        <h2 className="mt-2 text-lg font-bold text-text-primary">Backend implementation remains the source of truth</h2>
                        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">
                            This dashboard is intentionally limited to navigation and status messaging. Law-firm records, legal documents,
                            and workflow counters should stay empty until the backend resources and permissions are finalized.
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-2 self-start rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300">
                        <span className="h-2 w-2 rounded-full bg-current opacity-80" />
                        Pending backend integration
                    </div>
                </div>
            </section>
        </div>
    );
};
