import { Flag, Eye, X } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { StatusBadge } from '../../../../components/StatusBadge';
import { appRoutes } from '../../../../lib/appRoutes';
import type { ApiImportTransaction } from '../../types';
import { IMPORT_STAGES } from '../../utils/stageUtils';

interface ImportTransactionRowProps {
    transaction: ApiImportTransaction;
    onNavigate: (path: string) => void;
    onCancel: (id: number, ref: string) => void;
    onRemarks: (transaction: ApiImportTransaction) => void;
}

const CANCELLABLE_STATUSES = new Set(['Pending', 'Vessel Arrived', 'Processing', 'In Progress']);

function toTitleCase(str: string | null | undefined): string {
    if (!str) return '—';
    return str
        .toLowerCase()
        .replace(/\b([a-z])/g, (match) => match.toUpperCase())
        .replace(/\b([a-z0-9]*\d[a-z0-9]*)\b/gi, (match) => match.toUpperCase())
        .replace(/\bCma\b/gi, 'CMA')
        .replace(/\bCgm\b/gi, 'CGM')
        .replace(/\bMsc\b/gi, 'MSC')
        .replace(/\bApl\b/gi, 'APL')
        .replace(/\bOne\b/gi, 'ONE')
        .replace(/\bInc\b\.?/gi, 'Inc.')
        .replace(/\bCo\b\.?/gi, 'Co.')
        .replace(/\bCorp\b\.?/gi, 'Corp.')
        .replace(/\bLlc\b/gi, 'LLC')
        .replace(/\bLtd\b\.?/gi, 'Ltd.')
        .replace(/\.{2,}/g, '.');
}

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

function formatRelativeDate(dateString: string | null | undefined): string {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';

    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${Math.max(minutes, 1)}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${Math.max(days, 1)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatExactDateTime(dateString: string | null | undefined): string {
    if (!dateString) return 'No update timestamp';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'No update timestamp';

    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function ImportTransactionRow({
    transaction,
    onNavigate,
    onCancel,
    onRemarks,
}: ImportTransactionRowProps) {
    const path = appRoutes.trackingDetail.replace(
        ':referenceId',
        encodeURIComponent(transaction.customs_ref_no)
    );
    const isBlocked = transaction.open_remarks_count > 0;
    const canCancel = CANCELLABLE_STATUSES.has(transaction.status ?? '');
    const activeStage = getActiveImportStage(transaction);
    const openRemarksCount = transaction.open_remarks_count ?? 0;

    const selectivityBg =
        transaction.selective_color === 'green'
            ? 'bg-emerald-500 shadow-emerald-500/20'
            : transaction.selective_color === 'yellow'
              ? 'bg-amber-500 shadow-amber-500/20'
              : transaction.selective_color === 'red'
                ? 'bg-rose-500 shadow-rose-500/20'
                : 'bg-muted-foreground/40';

    return (
        <div
            onClick={() => onNavigate(path)}
            className="group grid gap-x-4 gap-y-3 p-4 lg:min-h-[52px] lg:grid-cols-[1.2fr_1.1fr_1.1fr_1.3fr_150px_140px_90px_70px] lg:items-center lg:gap-y-0 lg:px-4 lg:py-2 cursor-pointer border-b border-border/40 last:border-b-0 text-xs transition-colors hover:bg-muted/50 lg:min-w-[1080px]"
            role="row"
        >
            {/* Customs Ref + Remarks Flag */}
            <div className="flex min-w-0 items-start justify-between lg:block">
                <div className="min-w-0 flex items-center gap-2">
                    <span className={`size-2 rounded-full shrink-0 shadow-xs ${selectivityBg}`} />
                    <span className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        {transaction.customs_ref_no}
                    </span>
                    {isBlocked && (
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                onRemarks(transaction);
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive transition-colors hover:bg-destructive/20"
                        >
                            <Flag className="size-2.5" />
                            {openRemarksCount} remark{openRemarksCount === 1 ? '' : 's'}
                        </button>
                    )}
                </div>
                <div className="lg:hidden">
                    <StatusBadge status={transaction.status ?? ''} />
                </div>
            </div>

            {/* BL Number */}
            <div className="min-w-0">
                <div className="mb-1 text-[10px] font-bold uppercase text-muted-foreground lg:hidden">
                    BL Number
                </div>
                <span className="truncate text-xs text-muted-foreground block">
                    {transaction.bl_no || '—'}
                </span>
            </div>

            {/* Vessel */}
            <div className="min-w-0">
                <div className="mb-1 text-[10px] font-bold uppercase text-muted-foreground lg:hidden">
                    Vessel
                </div>
                <span
                    className="truncate text-xs font-semibold text-foreground block max-w-[180px]"
                    title={toTitleCase(transaction.vessel_name)}
                >
                    {toTitleCase(transaction.vessel_name)}
                </span>
            </div>

            {/* Importer */}
            <div className="min-w-0">
                <div className="mb-1 text-[10px] font-bold uppercase text-muted-foreground lg:hidden">
                    Importer
                </div>
                <span
                    className="truncate text-xs font-medium text-foreground block max-w-[200px]"
                    title={toTitleCase(transaction.importer?.name)}
                >
                    {toTitleCase(transaction.importer?.name)}
                </span>
            </div>

            {/* Current Stage */}
            <div className="min-w-0">
                <div className="mb-1 text-[10px] font-bold uppercase text-muted-foreground lg:hidden">
                    Current Stage
                </div>
                <span className="truncate text-xs text-muted-foreground block">
                    {activeStage}
                </span>
            </div>

            {/* Status */}
            <div className="hidden lg:flex lg:justify-start">
                <StatusBadge status={transaction.status ?? ''} />
            </div>

            {/* Updated */}
            <div
                className="hidden whitespace-nowrap text-left text-xs text-muted-foreground tabular-nums lg:block"
                title={formatExactDateTime(transaction.waiting_since ?? transaction.created_at)}
            >
                {formatRelativeDate(transaction.waiting_since ?? transaction.created_at)}
            </div>

            {/* Actions */}
            <div
                className="col-span-full flex items-center justify-end gap-1 border-t border-border/50 pt-2 lg:col-span-1 lg:border-t-0 lg:pt-0"
                onClick={(e) => e.stopPropagation()}
            >
                {transaction.open_remarks_count > 0 && (
                    <button
                        type="button"
                        onClick={() => onRemarks(transaction)}
                        className="inline-flex min-w-7 items-center justify-center gap-1 rounded-md border border-transparent bg-transparent px-1 py-1 text-[10px] font-bold text-destructive hover:bg-destructive/10 cursor-pointer"
                        title={`${transaction.open_remarks_count} open remark(s)`}
                    >
                        <Flag className="size-3.5" />
                        <span>{openRemarksCount}</span>
                    </button>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={() => onNavigate(path)}
                    title="View details"
                >
                    <Eye className="size-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    disabled={!canCancel}
                    className={`size-7 cursor-pointer ${canCancel ? 'text-muted-foreground hover:text-destructive' : 'opacity-30 cursor-not-allowed'}`}
                    onClick={() => {
                        if (canCancel) onCancel(transaction.id, transaction.customs_ref_no);
                    }}
                    title={canCancel ? 'Cancel transaction' : 'Cannot cancel'}
                >
                    <X className="size-3.5" />
                </Button>
            </div>
        </div>
    );
}

