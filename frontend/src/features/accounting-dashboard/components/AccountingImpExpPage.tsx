import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Icon } from '../../../components/Icon';
import { trackingApi } from '../../tracking/api/trackingApi';
import type { ApiExportStages, ApiImportStages } from '../../tracking/types';
import { trackingKeys } from '../../tracking/utils/queryKeys';
import {
    getExportAccountingActionability,
    getExportAccountingWaitingReason,
    getImportAccountingActionability,
    getImportAccountingWaitingReason,
    getWaitingAgeLabel,
} from '../../tracking/utils/stageUtils';
import { AccountingUploadModal } from './AccountingUploadModal';

export const AccountingImpExpPage = () => {
    const [view, setView] = useState<'import' | 'export'>('import');
    const [selectedTx, setSelectedTx] = useState<{ id: number, ref: string, clientName: string, type: 'import' | 'export', stages?: ApiImportStages | ApiExportStages } | null>(null);

    const importsQuery = useQuery({
        queryKey: [...trackingKeys.imports.list(), 'accounting-queue'],
        queryFn: () => trackingApi.getAllImports({ exclude_statuses: 'completed,cancelled', operational_scope: 'workspace' }),
    });

    const exportsQuery = useQuery({
        queryKey: [...trackingKeys.exports.list(), 'accounting-queue'],
        queryFn: () => trackingApi.getAllExports({ exclude_statuses: 'completed,cancelled', operational_scope: 'workspace' }),
    });

    const renderImportQueue = () => {
        if (importsQuery.isLoading) {
            return <div className="p-8 text-center text-text-muted">Loading imports...</div>;
        }

        const data = importsQuery.data ?? [];
        if (data.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center p-16 text-text-muted">
                    <Icon name="archive" className="h-12 w-12 opacity-50" />
                    <p className="mt-4 text-sm font-semibold">No accounting upload tasks available</p>
                </div>
            );
        }

        const readyTransactions = data.filter((transaction) => getImportAccountingActionability(transaction.stages).billing);
        const waitingTransactions = data.filter((transaction) => ! readyTransactions.includes(transaction));

        return (
            <div className="space-y-6 p-4">
                <QueueSection
                    title="Ready to Upload"
                    tone="ready"
                    emptyMessage="No accounting files are ready right now."
                    transactions={readyTransactions.map((transaction) => (
                        <TransactionQueueCard
                            key={`import-ready-${transaction.id}`}
                            title={transaction.customs_ref_no || transaction.bl_no || 'Pending Ref'}
                            subtitle={`${transaction.importer?.name || 'Unknown Client'} • Import`}
                            meta={`ETA: ${transaction.arrival_date || '—'}`}
                            tone="ready"
                            actionLabel="Open Tasks"
                            onAction={() => setSelectedTx({
                                id: transaction.id,
                                ref: transaction.customs_ref_no || transaction.bl_no || 'Pending Ref',
                                clientName: transaction.importer?.name || 'Unknown Client',
                                type: 'import',
                                stages: transaction.stages,
                            })}
                            badges={[
                                <DocumentStatusBadge
                                    key="billing"
                                    label="Billing & Liquidation"
                                    status={transaction.stages?.billing}
                                    isActionable={getImportAccountingActionability(transaction.stages).billing}
                                />,
                            ]}
                        />
                    ))}
                />
                <QueueSection
                    title="Waiting / Monitoring"
                    tone="waiting"
                    emptyMessage="No waiting accounting transactions."
                    transactions={waitingTransactions.map((transaction) => (
                        <TransactionQueueCard
                            key={`import-waiting-${transaction.id}`}
                            title={transaction.customs_ref_no || transaction.bl_no || 'Pending Ref'}
                            subtitle={`${transaction.importer?.name || 'Unknown Client'} • Import`}
                            meta={`ETA: ${transaction.arrival_date || '—'}`}
                            tone="waiting"
                            blocker={getImportAccountingWaitingReason(transaction.stages)}
                            agingLabel={getWaitingAgeLabel(transaction.waiting_since ?? transaction.created_at)}
                            actionLabel="Monitor Progress"
                            onAction={() => setSelectedTx({
                                id: transaction.id,
                                ref: transaction.customs_ref_no || transaction.bl_no || 'Pending Ref',
                                clientName: transaction.importer?.name || 'Unknown Client',
                                type: 'import',
                                stages: transaction.stages,
                            })}
                            badges={[
                                <DocumentStatusBadge
                                    key="billing"
                                    label="Billing & Liquidation"
                                    status={transaction.stages?.billing}
                                    isActionable={getImportAccountingActionability(transaction.stages).billing}
                                />,
                            ]}
                        />
                    ))}
                />
            </div>
        );
    };

    const renderExportQueue = () => {
        if (exportsQuery.isLoading) {
            return <div className="p-8 text-center text-text-muted">Loading exports...</div>;
        }

        const data = exportsQuery.data ?? [];
        if (data.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center p-16 text-text-muted">
                    <Icon name="archive" className="h-12 w-12 opacity-50" />
                    <p className="mt-4 text-sm font-semibold">No accounting upload tasks available</p>
                </div>
            );
        }

        const readyTransactions = data.filter((transaction) => getExportAccountingActionability(transaction.stages).billing);
        const waitingTransactions = data.filter((transaction) => ! readyTransactions.includes(transaction));

        return (
            <div className="space-y-6 p-4">
                <QueueSection
                    title="Ready to Upload"
                    tone="ready"
                    emptyMessage="No accounting files are ready right now."
                    transactions={readyTransactions.map((transaction) => (
                        <TransactionQueueCard
                            key={`export-ready-${transaction.id}`}
                            title={transaction.bl_no || 'Pending BL'}
                            subtitle={`${transaction.shipper?.name || 'Unknown Client'} • Export`}
                            meta={`Vessel: ${transaction.vessel || '—'}`}
                            tone="ready"
                            actionLabel="Open Tasks"
                            onAction={() => setSelectedTx({
                                id: transaction.id,
                                ref: transaction.bl_no || 'Pending BL',
                                clientName: transaction.shipper?.name || 'Unknown Client',
                                type: 'export',
                                stages: transaction.stages,
                            })}
                            badges={[
                                <DocumentStatusBadge
                                    key="billing"
                                    label="Billing & Liquidation"
                                    status={transaction.stages?.billing}
                                    isActionable={getExportAccountingActionability(transaction.stages).billing}
                                />,
                            ]}
                        />
                    ))}
                />
                <QueueSection
                    title="Waiting / Monitoring"
                    tone="waiting"
                    emptyMessage="No waiting accounting transactions."
                    transactions={waitingTransactions.map((transaction) => (
                        <TransactionQueueCard
                            key={`export-waiting-${transaction.id}`}
                            title={transaction.bl_no || 'Pending BL'}
                            subtitle={`${transaction.shipper?.name || 'Unknown Client'} • Export`}
                            meta={`Vessel: ${transaction.vessel || '—'}`}
                            tone="waiting"
                            blocker={getExportAccountingWaitingReason(transaction.stages)}
                            agingLabel={getWaitingAgeLabel(transaction.waiting_since ?? transaction.created_at)}
                            actionLabel="Monitor Progress"
                            onAction={() => setSelectedTx({
                                id: transaction.id,
                                ref: transaction.bl_no || 'Pending BL',
                                clientName: transaction.shipper?.name || 'Unknown Client',
                                type: 'export',
                                stages: transaction.stages,
                            })}
                            badges={[
                                <DocumentStatusBadge
                                    key="billing"
                                    label="Billing & Liquidation"
                                    status={transaction.stages?.billing}
                                    isActionable={getExportAccountingActionability(transaction.stages).billing}
                                />,
                            ]}
                        />
                    ))}
                />
            </div>
        );
    };

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="flex flex-col px-4 pt-4 pb-2">
                <h1 className="text-2xl font-bold tracking-tight text-text-primary">Finance & Accounting Tasks</h1>
                <p className="mt-1 text-sm text-text-secondary">View shared pending accounting stages across active transactions and complete billing and liquidation uploads.</p>
            </div>
            <div className="flex gap-4 border-b border-border px-4 mt-2">
                <button
                    onClick={() => setView('import')}
                    className={`flex items-center gap-2 border-b-2 px-2 pb-3 text-sm font-bold transition-colors ${
                        view === 'import'
                            ? 'border-emerald-600 text-emerald-600'
                            : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                    Imports
                    {importsQuery.data && importsQuery.data.length > 0 && (
                        <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 text-[10px] font-bold leading-none text-emerald-600 dark:text-emerald-400">
                            {importsQuery.data.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setView('export')}
                    className={`flex items-center gap-2 border-b-2 px-2 pb-3 text-sm font-bold transition-colors ${
                        view === 'export'
                            ? 'border-emerald-600 text-emerald-600'
                            : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                    Exports
                    {exportsQuery.data && exportsQuery.data.length > 0 && (
                        <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 text-[10px] font-bold leading-none text-emerald-600 dark:text-emerald-400">
                            {exportsQuery.data.length}
                        </span>
                    )}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-8 bg-surface-secondary/20">
                {view === 'import' ? renderImportQueue() : renderExportQueue()}
            </div>

            {selectedTx && (
                <AccountingUploadModal
                    isOpen={!!selectedTx}
                    onClose={() => setSelectedTx(null)}
                    transactionId={selectedTx.id}
                    reference={selectedTx.ref}
                    type={selectedTx.type}
                    clientName={selectedTx.clientName}
                    transactionStages={selectedTx.stages}
                />
            )}
        </div>
    );
};

const QueueSection = ({
    title,
    tone,
    emptyMessage,
    transactions,
}: {
    title: string;
    tone: 'ready' | 'waiting';
    emptyMessage: string;
    transactions: ReactNode[];
}) => (
    <section className="space-y-3">
        <div className="flex items-center gap-3">
            <div className={`h-5 w-1 rounded-full ${tone === 'ready' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-text-secondary">{title}</h2>
            <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-text-muted">
                {transactions.length}
            </span>
        </div>
        {transactions.length > 0 ? transactions : (
            <div className="rounded-xl border border-dashed border-border bg-surface/70 p-6 text-sm text-text-muted">
                {emptyMessage}
            </div>
        )}
    </section>
);

const TransactionQueueCard = ({
    title,
    subtitle,
    meta,
    tone,
    blocker,
    agingLabel,
    actionLabel,
    onAction,
    badges,
}: {
    title: string;
    subtitle: string;
    meta: string;
    tone: 'ready' | 'waiting';
    blocker?: string | null;
    agingLabel?: string | null;
    actionLabel: string;
    onAction: () => void;
    badges: ReactNode[];
}) => (
    <div
        className={`rounded-xl border p-4 shadow-sm transition-shadow ${
            tone === 'ready'
                ? 'border-border bg-surface hover:shadow-md'
                : 'border-slate-200 bg-slate-50/80 opacity-90 dark:border-slate-800 dark:bg-slate-900/35'
        }`}
    >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
                <h3 className="text-sm font-bold tracking-tight text-text-primary">{title}</h3>
                <p className="mt-1 text-xs text-text-secondary">{subtitle}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase text-text-muted">{meta}</p>
                {(blocker || agingLabel) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {blocker && (
                            <p className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                <Icon name="clock" className="h-3 w-3" />
                                {blocker}
                            </p>
                        )}
                        {agingLabel && (
                            <p className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                                <Icon name="alert-circle" className="h-3 w-3" />
                                {agingLabel}
                            </p>
                        )}
                    </div>
                )}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
                <button
                    onClick={onAction}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                        tone === 'ready'
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                >
                    {actionLabel}
                    <Icon name="chevron-right" className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4">
            {badges}
        </div>
    </div>
);

const DocumentStatusBadge = ({ label, status, isActionable }: { label: string, status?: string, isActionable: boolean }) => {
    let colorClass = 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    let displayStatus = isActionable ? 'Ready' : 'Waiting';
    
    if (status === 'completed') {
        colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50';
        displayStatus = 'Uploaded';
    } else if (status === 'in_progress' || status === 'review') {
        colorClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50';
        displayStatus = 'For Review';
    } else if (status === 'rejected') {
        colorClass = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50';
        displayStatus = 'Action Needed';
    }

    return (
        <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-text-secondary">{label}:</span>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${colorClass}`}>
                {displayStatus}
            </span>
        </div>
    );
};
