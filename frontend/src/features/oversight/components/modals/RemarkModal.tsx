import { useState } from 'react';
import { useTransactionSyncSubscription } from '../../../../hooks/useTransactionSyncSubscription';
import { useCreateRemark, useDocuments, useRemarks, useResolveRemark } from '../../hooks/useRemarks';
import type { CreateRemarkData } from '../../types/remark.types';

const SEVERITY_CFG = {
    info: { label: 'Info', color: 'var(--info)', bg: 'color-mix(in srgb, var(--info) 12%, transparent)' },
    warning: { label: 'Warning', color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 12%, transparent)' },
    critical: { label: 'Critical', color: 'var(--danger)', bg: 'color-mix(in srgb, var(--danger) 12%, transparent)' },
} as const;

const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
};

interface RemarkModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionType: 'import' | 'export';
    transactionId: number | null;
    transactionLabel: string;
}

export const RemarkModal = ({ isOpen, onClose, transactionType, transactionId, transactionLabel }: RemarkModalProps) => {
    const documentSelectClassName = 'w-full px-3 py-2 rounded-lg text-sm border transition-colors focus:outline-none [color-scheme:light] dark:[color-scheme:dark] bg-muted border-border text-foreground focus:border-primary/50';
    const documentOptionClassName = 'bg-card text-foreground';

    const [severity, setSeverity] = useState<CreateRemarkData['severity']>('warning');
    const [message, setMessage] = useState('');
    const [documentId, setDocumentId] = useState<number | null>(null);

    const { data: remarksData, isLoading } = useRemarks(transactionType, transactionId, isOpen);
    const { data: documentsData } = useDocuments(transactionType, transactionId, isOpen);
    const createRemark = useCreateRemark();
    const resolveRemark = useResolveRemark(transactionType, transactionId);

    useTransactionSyncSubscription({
        type: transactionType,
        id: transactionId,
        enabled: isOpen && transactionId !== null,
    });


    if (!isOpen || transactionId === null) return null;

    const remarks = remarksData?.data ?? [];
    const openRemarks = remarks.filter(r => !r.is_resolved);
    const resolvedRemarks = remarks.filter(r => r.is_resolved);

    const handleSubmit = async () => {
        if (!message.trim()) return;
        await createRemark.mutateAsync({ type: transactionType, id: transactionId, data: { severity, message: message.trim(), document_id: documentId } });
        setMessage('');
        setSeverity('warning');
        setDocumentId(null);
    };

    const handleResolve = async (remarkId: number) => {
        await resolveRemark.mutateAsync(remarkId);
    };



    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-backdrop-in" onClick={onClose}>
            <div
                className="w-full max-w-2xl rounded-2xl max-h-[85vh] flex flex-col animate-modal-in bg-card"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Transaction Remarks</h2>
                        <p className="text-xs mt-0.5 text-muted-foreground">{transactionLabel}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-foreground/10">
                        <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Create remark form */}
                <div className="px-6 py-4 border-b border-border">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-muted-foreground">
                        Add Remark
                    </p>

                    {/* Severity pills */}
                    <div className="flex gap-2 mb-3">
                        {(Object.keys(SEVERITY_CFG) as Array<keyof typeof SEVERITY_CFG>).map(s => {
                            const cfg = SEVERITY_CFG[s];
                            const active = severity === s;
                            return (
                                <button
                                    key={s}
                                    onClick={() => setSeverity(s)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                    style={{
                                        color: cfg.color,
                                        backgroundColor: active ? cfg.bg : 'transparent',
                                        border: `1.5px solid ${active ? cfg.color : 'var(--border)'}`,
                                    }}
                                >
                                    {cfg.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Pin to Document */}
                    {documentsData?.data && documentsData.data.length > 0 && (
                        <div className="mb-3">
                            <select
                                value={documentId ?? ''}
                                onChange={e => setDocumentId(e.target.value ? Number(e.target.value) : null)}
                                className={documentSelectClassName}
                            >
                                <option value="" className={documentOptionClassName}>Do not pin to a document</option>
                                {documentsData.data.map(doc => (
                                    <option key={doc.id} value={doc.id} className={documentOptionClassName}>
                                        {doc.type}: {doc.filename}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Message */}
                    <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Describe the issue (e.g., 'BL No. is incorrect, please revise PPA docs')..."
                        rows={3}
                        maxLength={1000}
                        className="w-full px-3 py-2 rounded-lg text-sm resize-none border transition-colors focus:outline-none bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50"
                    />
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                            {message.length}/1000
                        </span>
                        <button
                            onClick={handleSubmit}
                            disabled={!message.trim() || createRemark.isPending}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold text-primary-foreground bg-primary disabled:opacity-40 transition-opacity"
                        >
                            {createRemark.isPending ? 'Sending...' : 'Add Remark'}
                        </button>
                    </div>
                </div>

                {/* Remarks list */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: 'var(--primary)' }} />
                        </div>
                    ) : remarks.length === 0 ? (
                        <p className="text-sm text-center py-8 text-muted-foreground">
                            No remarks yet. Add one above to flag an issue.
                        </p>
                    ) : (
                        <>
                            {/* Open remarks */}
                            {openRemarks.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
                                        Open ({openRemarks.length})
                                    </p>
                                    <div className="space-y-2">
                                        {openRemarks.map(r => {
                                            const cfg = SEVERITY_CFG[r.severity];
                                            return (
                                                <div key={r.id} className="rounded-lg p-3 border border-border bg-muted">
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
                                                                    {r.author?.name} · {timeAgo(r.created_at)}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm leading-relaxed text-foreground">
                                                                {r.message}
                                                            </p>
                                                            {r.document && (
                                                                <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-foreground/10 text-muted-foreground">
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                                    {r.document.filename}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handleResolve(r.id)}
                                                            disabled={resolveRemark.isPending}
                                                            className="shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold text-success bg-success/10 hover:bg-success/20 transition-colors disabled:opacity-40"
                                                        >
                                                            Resolve
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Resolved remarks */}
                            {resolvedRemarks.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
                                        Resolved ({resolvedRemarks.length})
                                    </p>
                                    <div className="space-y-2">
                                        {resolvedRemarks.map(r => (
                                            <div key={r.id} className="rounded-lg p-3 border opacity-60 border-border bg-muted">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <svg className="w-3.5 h-3.5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        Resolved by {r.resolved_by?.name ?? 'Unknown'} · {r.resolved_at ? timeAgo(r.resolved_at) : ''}
                                                    </span>
                                                </div>
                                                <p className="text-sm line-through text-muted-foreground">
                                                    {r.message}
                                                </p>
                                                {r.document && (
                                                    <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold opacity-60 bg-foreground/10 text-muted-foreground">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                        {r.document.filename}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
