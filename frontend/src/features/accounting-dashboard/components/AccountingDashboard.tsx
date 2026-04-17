import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CurrentDateTime } from '../../../components/CurrentDateTime';
import { appRoutes } from '../../../lib/appRoutes';
import { trackingApi } from '../../tracking/api/trackingApi';
import { trackingKeys } from '../../tracking/utils/queryKeys';

type ModuleCard = {
    label: string;
    description: string;
    path: string;
    accent: string;
    icon: string;
};

const moduleCards: ModuleCard[] = [
    {
        label: 'Transaction Tasks',
        description: 'Track and manage import/export workflows for billing and liquidation.',
        path: appRoutes.accountantImpExp,
        accent: '#10b981', // emerald-500
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    },
    {
        label: 'Documents',
        description: 'Access billing attachments, finance documents, and records.',
        path: appRoutes.accountantDocuments,
        accent: '#34d399', // emerald-400
        icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2',
    },
];

export const AccountingDashboard = () => {
    const navigate = useNavigate();

    const importsQuery = useQuery({
        queryKey: [...trackingKeys.imports.list(), 'accounting-dashboard-imports'],
        queryFn: () => trackingApi.getAllImports({ exclude_statuses: 'completed,cancelled' }),
    });

    const exportsQuery = useQuery({
        queryKey: [...trackingKeys.exports.list(), 'accounting-dashboard-exports'],
        queryFn: () => trackingApi.getAllExports({ exclude_statuses: 'completed,cancelled' }),
    });

    const calculateMetrics = () => {
        let pendingBilling = 0;

        importsQuery.data?.forEach(tx => {
            if (tx.stages?.billing !== 'completed') {
                pendingBilling++;
            }
        });

        exportsQuery.data?.forEach(tx => {
            if (tx.stages?.billing !== 'completed') {
                pendingBilling++;
            }
        });

        return {
            pendingBilling,
        };
    };

    const metrics = calculateMetrics();

    return (
        <div className="space-y-8 px-6 py-6">
            <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-text-muted">Accounting Workspace</p>
                    <h1 className="mt-2 text-4xl font-bold tracking-tight text-text-primary">Accounting Dashboard</h1>
                    <p className="mt-3 max-w-2xl text-sm text-text-secondary">
                        Manage shared accounting-stage uploads while encoder ownership remains with the brokerage file owner.
                    </p>
                </div>
                <CurrentDateTime
                    className="text-left sm:text-right"
                    timeClassName="text-2xl font-mono font-bold tracking-tight text-text-primary"
                    dateClassName="mt-1 text-xs font-mono uppercase tracking-[0.25em] text-text-secondary"
                />
            </header>

            <section className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col rounded-xl border border-emerald-500/10 bg-emerald-50/50 dark:bg-emerald-950/10 p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70">Transactions Pending Billing</p>
                    <div className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        {importsQuery.isLoading || exportsQuery.isLoading ? '...' : metrics.pendingBilling}
                    </div>
                </div>
                <div className="flex flex-col rounded-xl border border-emerald-500/10 bg-emerald-50/50 dark:bg-emerald-950/10 p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70">Tasks Needs Re-upload</p>
                    <div className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        0
                    </div>
                </div>
            </section>

            <section>
                <div className="mb-4 flex items-center gap-3">
                    <div className="h-5 w-1 rounded-full bg-emerald-500" />
                    <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-text-secondary">Modules</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    {moduleCards.map((card) => (
                        <button
                            key={card.label}
                            id={`accounting-module-${card.label.toLowerCase().replace(/\s+/g, '-')}`}
                            type="button"
                            onClick={() => navigate(card.path)}
                            className="group relative flex flex-col gap-4 overflow-hidden rounded-xl border border-border bg-surface p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-border-strong hover:bg-hover hover:shadow-md"
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
        </div>
    );
};
