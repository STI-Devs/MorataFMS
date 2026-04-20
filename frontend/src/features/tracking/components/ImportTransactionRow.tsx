import { Icon } from '../../../components/Icon';
import { StatusBadge } from '../../../components/StatusBadge';
import { appRoutes } from '../../../lib/appRoutes';
import type { ApiImportTransaction } from '../types';
import { IMPORT_STAGES } from '../utils/stageUtils';

interface ImportTransactionRowProps {
    transaction: ApiImportTransaction;
    onNavigate: (path: string) => void;
    onCancel: (id: number, ref: string) => void;
    onRemarks: (transaction: ApiImportTransaction) => void;
}

const CANCELLABLE_STATUSES = new Set(['Pending', 'Vessel Arrived', 'Processing', 'In Progress']);

function getActiveImportStage(transaction: ApiImportTransaction): string {
    const stages = transaction.stages;
    if (!stages) return '—';
    const notApplicable = new Set(transaction.not_applicable_stages ?? []);

    for (const stage of IMPORT_STAGES) {
        if (notApplicable.has(stage.type)) continue;
        const stageStatus = stages[stage.type as keyof typeof stages];
        if (stageStatus !== 'completed') return stage.title;
    }
    return 'Billing & Liquidation';
}

function getAssigneeInitials(name: string | undefined): string {
    if (!name) return '—';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatRelativeDate(dateString: string | null | undefined): string {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';

    const now = Date.now();
    const diff = now - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ImportTransactionRow({ transaction, onNavigate, onCancel, onRemarks }: ImportTransactionRowProps) {
    const path = appRoutes.trackingDetail.replace(':referenceId', encodeURIComponent(transaction.customs_ref_no));
    const isBlocked = transaction.open_remarks_count > 0;
    const canCancel = CANCELLABLE_STATUSES.has(transaction.status ?? '');
    const activeStage = getActiveImportStage(transaction);
    const assigneeName = transaction.assigned_user?.name;
    const initials = getAssigneeInitials(assigneeName);
    const missingDocs = transaction.documents_count === 0 && transaction.status !== 'Completed';

    return (
        <div
            onClick={() => onNavigate(path)}
            className={`
                group grid gap-x-3 gap-y-3 p-4 lg:grid-cols-[1.4fr_1fr_1.2fr_1.4fr_100px_60px_80px_70px_48px] lg:items-center lg:gap-y-0 lg:px-4 lg:py-3
                cursor-pointer border-b border-border/40 last:border-0 text-xs transition-colors hover:bg-hover/60
                ${isBlocked ? 'border-l-4 border-red-500 bg-red-50/25 dark:bg-red-950/10' : 'border-l-4 border-transparent'}
            `}
            role="row"
        >
            <div className="flex min-w-0 items-center justify-between lg:block">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: transaction.selective_color === 'green' ? '#22c55e' : transaction.selective_color === 'yellow' ? '#eab308' : transaction.selective_color === 'red' ? '#ef4444' : '#f97316' }}
                    />
                    <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-text-primary lg:text-xs">{transaction.customs_ref_no}</div>
                        <div className="mt-0.5 hidden text-[10px] text-text-muted lg:block">Primary identifier</div>
                    </div>
                </div>
                <div className="lg:hidden">
                    <StatusBadge status={transaction.status ?? ''} />
                </div>
            </div>

            <div className="min-w-0">
                <div className="mb-1 text-[10px] font-bold uppercase text-text-muted lg:hidden">BL Number</div>
                <div className="truncate rounded-lg border border-border/70 bg-surface px-2.5 py-2 font-mono text-[11px] text-text-secondary lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
                    {transaction.bl_no || '—'}
                </div>
            </div>

            <div className="min-w-0">
                <div className="mb-1 text-[10px] font-bold uppercase text-text-muted lg:hidden">Importer</div>
                <div className="truncate text-sm text-text-secondary lg:text-xs">{transaction.importer?.name ?? '—'}</div>
            </div>

            <div className="min-w-0">
                <div className="mb-1 text-[10px] font-bold uppercase text-text-muted lg:hidden">Current Stage</div>
                <div className="truncate text-sm font-medium text-text-secondary lg:text-[11px]">{activeStage}</div>
            </div>

            <div className="hidden lg:flex justify-start">
                <StatusBadge status={transaction.status ?? ''} />
            </div>

            <div className="flex items-center gap-2 border-t border-border/50 pt-2 lg:justify-center lg:border-t-0 lg:pt-0">
                <span className="text-text-muted text-[10px] uppercase font-bold lg:hidden">Docs</span>
                <div className="lg:mx-auto">
                    {missingDocs ? (
                        <span className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600 dark:border-red-900/30 dark:bg-red-900/30 dark:text-red-300">
                            Needs docs
                        </span>
                    ) : (
                        <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-300">
                            Ready
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 border-t border-border/50 pt-2 lg:justify-center lg:border-t-0 lg:pt-0">
                <span className="text-text-muted text-[10px] uppercase font-bold lg:hidden">Assigned</span>
                <div className="lg:mx-auto">
                    {assigneeName ? (
                        <span
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 bg-blue-600 text-[9px] font-bold text-white shadow-sm"
                            title={assigneeName}
                        >
                            {initials}
                        </span>
                    ) : (
                        <span className="text-text-muted/40 text-[10px]">—</span>
                    )}
                </div>
            </div>

            <div className="hidden w-full truncate text-right text-[10px] text-text-muted lg:block">
                {formatRelativeDate(transaction.waiting_since ?? transaction.created_at)}
            </div>

            <div className="col-span-full flex items-center justify-end gap-1.5 border-t border-border/50 pt-2 lg:col-span-1 lg:border-t-0 lg:pt-0" onClick={e => e.stopPropagation()}>
                {transaction.open_remarks_count > 0 && (
                    <button
                        type="button"
                        onClick={() => onRemarks(transaction)}
                        className="rounded-lg border border-red-200 bg-surface p-2 text-red-500 shadow-sm transition-colors hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/30 lg:border-transparent lg:bg-transparent lg:p-1.5 lg:shadow-none"
                        title={`${transaction.open_remarks_count} open remark(s)`}
                    >
                        <Icon name="flag" className="w-3.5 h-3.5" />
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => onNavigate(path)}
                    className="rounded-lg border border-border bg-surface p-2 text-blue-600 shadow-sm transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/30 lg:border-transparent lg:bg-transparent lg:p-1.5 lg:shadow-none"
                    title="View details"
                >
                    <Icon name="eye" className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => { if (canCancel) onCancel(transaction.id, transaction.customs_ref_no); }}
                    disabled={!canCancel}
                    className={`rounded-lg p-2 transition-colors ${canCancel ? 'border border-transparent text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer' : 'text-text-muted/30 cursor-not-allowed'}`}
                    title={canCancel ? 'Cancel transaction' : 'Cannot cancel'}
                >
                    <Icon name="x" className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
