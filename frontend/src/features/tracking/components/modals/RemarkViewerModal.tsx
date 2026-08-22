import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { remarkApi } from '../../../oversight/api/remarkApi';
import type { Remark } from '../../../oversight/types/remark.types';
import { remarkKeys } from '../../../oversight/utils/queryKeys';
import { trackingKeys } from '../../utils/queryKeys';

const SEVERITY_CFG = {
    info: { label: 'Info', color: 'var(--info)', bg: 'color-mix(in srgb, var(--info) 12%, transparent)' },
    warning: { label: 'Warning', color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 12%, transparent)' },
    critical: { label: 'Critical', color: 'var(--danger)', bg: 'color-mix(in srgb, var(--danger) 12%, transparent)' },
} as const;

interface RemarkViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionType: 'import' | 'export';
    transactionId: number;
    transactionLabel: string;
}

export const RemarkViewerModal = ({ isOpen, onClose, transactionType, transactionId, transactionLabel }: RemarkViewerModalProps) => {
    const qc = useQueryClient();

    const { data: remarksData, isLoading } = useQuery({
        queryKey: remarkKeys.list(transactionType, transactionId),
        queryFn: () => remarkApi.getRemarks(transactionType, transactionId),
        enabled: isOpen,
    });

    const resolveRemark = useMutation({
        mutationFn: (remarkId: number) => remarkApi.resolveRemark(remarkId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: remarkKeys.list(transactionType, transactionId) });
            // Refresh import/export list to update badge
            qc.invalidateQueries({ queryKey: trackingKeys.imports.all });
            qc.invalidateQueries({ queryKey: trackingKeys.exports.all });
        },
    });

    if (!isOpen) return null;

    const remarks: Remark[] = remarksData?.data ?? [];
    const openRemarks = remarks.filter(r => !r.is_resolved);
    const resolvedRemarks = remarks.filter(r => r.is_resolved);

    const formatTimestamp = (dateStr: string) =>
        new Date(dateStr).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-backdrop-in" onClick={onClose}>
            <div
                className="w-full max-w-lg rounded-2xl max-h-[80vh] flex flex-col animate-modal-in bg-card"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Admin Remarks</h2>
                        <p className="text-xs mt-0.5 text-muted-foreground">{transactionLabel}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-muted">
                        <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Remarks list */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: 'var(--primary)' }} />
                        </div>
                    ) : openRemarks.length === 0 && resolvedRemarks.length === 0 ? (
                        <p className="text-sm text-center py-8 text-muted-foreground">
                            No remarks for this transaction.
                        </p>
                    ) : (
                        <>
                            {openRemarks.map(r => {
                                const cfg = SEVERITY_CFG[r.severity];
                                return (
                                    <div key={r.id} className="rounded-lg p-3 border border-border bg-muted/50">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                                                        style={{ color: cfg.color, backgroundColor: cfg.bg }}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                                                        {cfg.label}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {r.author?.name} · {formatTimestamp(r.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-sm leading-relaxed text-foreground">
                                                    {r.message}
                                                </p>
                                                {r.document && (
                                                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-muted text-muted-foreground">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                        {r.document.filename}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => resolveRemark.mutate(r.id)}
                                                disabled={resolveRemark.isPending}
                                                className="shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold text-success bg-success/10 hover:bg-success/20 transition-colors disabled:opacity-40"
                                            >
                                                Mark Done
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {resolvedRemarks.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider mb-2 mt-4 text-muted-foreground">
                                        Resolved ({resolvedRemarks.length})
                                    </p>
                                    {resolvedRemarks.map(r => (
                                        <div key={r.id} className="rounded-lg p-3 border border-border opacity-50 mb-2 bg-muted/30">
                                            <div className="flex items-center gap-2 mb-1">
                                                <svg className="w-3.5 h-3.5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span className="text-[10px] text-muted-foreground">
                                                    Resolved by {r.resolved_by?.name ?? 'Unknown'}
                                                </span>
                                            </div>
                                            <p className="text-sm line-through text-muted-foreground">{r.message}</p>
                                            {r.document && (
                                                <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold opacity-60 bg-muted text-muted-foreground">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                    {r.document.filename}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

