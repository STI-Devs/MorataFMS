import { Icon } from '../../../components/Icon';
import { StatusBadge } from '../../../components/StatusBadge';
import { appRoutes } from '../../../lib/appRoutes';
import type { ApiExportTransaction } from '../types';
import { EXPORT_STAGES } from '../utils/stageUtils';

interface ExportTransactionRowProps {
    transaction: ApiExportTransaction;
    onNavigate: (path: string) => void;
    onCancel: (id: number, ref: string) => void;
    onRemarks: (transaction: ApiExportTransaction) => void;
}

const CANCELLABLE_STATUSES = new Set(['Pending', 'In Transit', 'Departure', 'Processing', 'In Progress']);

function getActiveExportStage(transaction: ApiExportTransaction): string {
    const stages = transaction.stages;
    if (!stages) return '—';
    const notApplicable = new Set(transaction.not_applicable_stages ?? []);

    for (const stage of EXPORT_STAGES) {
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

function getPrimaryRef(transaction: ApiExportTransaction): { primary: string; secondary: string | null } {
    const bl = transaction.bl_no || null;
    const ref = `EXP-${String(transaction.id).padStart(4, '0')}`;
    return { primary: bl ?? ref, secondary: null };
}

export function ExportTransactionRow({ transaction, onNavigate, onCancel, onRemarks }: ExportTransactionRowProps) {
    const ref = transaction.bl_no || `EXP-${String(transaction.id).padStart(4, '0')}`;
    const path = appRoutes.trackingDetail.replace(':referenceId', encodeURIComponent(ref));
    const isBlocked = transaction.open_remarks_count > 0;
    const canCancel = CANCELLABLE_STATUSES.has(transaction.status ?? '');
    const activeStage = getActiveExportStage(transaction);
    const assigneeName = transaction.assigned_user?.name;
    const initials = getAssigneeInitials(assigneeName);
    const missingDocs = transaction.documents_count === 0 && transaction.status !== 'Completed';
    const { primary } = getPrimaryRef(transaction);

    return (
        <div
            onClick={() => onNavigate(path)}
            className={`
                group grid gap-x-3 gap-y-3 p-4 lg:grid-cols-[1.2fr_1.2fr_1.4fr_100px_60px_80px_70px_48px] lg:items-center lg:gap-y-0 lg:px-4 lg:py-3
                cursor-pointer border-b border-border/40 last:border-0 text-xs transition-colors hover:bg-hover/60
                ${isBlocked ? 'border-l-4 border-red-500 bg-red-50/25 dark:bg-red-950/10' : 'border-l-4 border-transparent'}
            `}
            role="row"
        >
            <div className="flex min-w-0 items-center justify-between lg:block">
                <div className="min-w-0">
                    <div className="truncate font-mono text-sm font-semibold text-text-primary lg:text-[11px]">{primary}</div>
                    <div className="mt-0.5 hidden text-[10px] text-text-muted lg:block">Primary identifier</div>
                </div>
                <div className="lg:hidden">
                    <StatusBadge status={transaction.status ?? ''} />
                </div>
            </div>

            <div className="min-w-0">
                <div className="mb-1 text-[10px] font-bold uppercase text-text-muted lg:hidden">Shipper</div>
                <div className="truncate text-sm text-text-secondary lg:text-xs">{transaction.shipper?.name ?? '—'}</div>
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
                    onClick={() => { if (canCancel) onCancel(transaction.id, ref); }}
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
