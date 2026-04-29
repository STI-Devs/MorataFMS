import { useState } from 'react';
import { useTransactionSyncSubscription } from '../../../../hooks/useTransactionSyncSubscription';
import { useTheme } from '../../../../context/ThemeContext';
import { useCreateRemark, useDocuments, useRemarks, useResolveRemark } from '../../hooks/useRemarks';
import type { CreateRemarkData } from '../../types/remark.types';

const SEVERITY_CFG = {
    info: { label: 'Info', color: '#0a84ff', bg: 'rgba(10,132,255,0.12)' },
    warning: { label: 'Warning', color: '#ff9f0a', bg: 'rgba(255,159,10,0.12)' },
    critical: { label: 'Critical', color: '#ff453a', bg: 'rgba(255,69,58,0.12)' },
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
    const { theme } = useTheme();
    const isDark = theme === 'dark';

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
                className={`w-full max-w-2xl rounded-2xl max-h-[85vh] flex flex-col animate-modal-in ${isDark ? 'bg-[#1c1c1e]' : 'bg-white'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <div>
                        <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Transaction Remarks</h2>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{transactionLabel}</p>
                    </div>
                    <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                        <svg className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Create remark form */}
                <div className={`px-6 py-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
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
                                        border: `1.5px solid ${active ? cfg.color : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
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
                                className={`w-full px-3 py-2 rounded-lg text-sm border transition-colors focus:outline-none ${isDark
                                        ? 'bg-white/5 border-white/10 text-white focus:border-blue-500/50'
                                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500/50'
                                    }`}
                            >
                                <option value="">Do not pin to a document</option>
                                {documentsData.data.map(doc => (
                                    <option key={doc.id} value={doc.id}>
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
                        className={`w-full px-3 py-2 rounded-lg text-sm resize-none border transition-colors focus:outline-none ${isDark
                                ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500/50'
                                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500/50'
                            }`}
                    />
                    <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            {message.length}/1000
                        </span>
                        <button
                            onClick={handleSubmit}
                            disabled={!message.trim() || createRemark.isPending}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-br from-blue-600 to-indigo-700 disabled:opacity-40 transition-opacity"
                        >
                            {createRemark.isPending ? 'Sending...' : 'Add Remark'}
                        </button>
                    </div>
                </div>

                {/* Remarks list */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#0a84ff' }} />
                        </div>
                    ) : remarks.length === 0 ? (
                        <p className={`text-sm text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            No remarks yet. Add one above to flag an issue.
                        </p>
                    ) : (
                        <>
                            {/* Open remarks */}
                            {openRemarks.length > 0 && (
                                <div>
                                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Open ({openRemarks.length})
                                    </p>
                                    <div className="space-y-2">
                                        {openRemarks.map(r => {
                                            const cfg = SEVERITY_CFG[r.severity];
                                            return (
                                                <div key={r.id} className={`rounded-lg p-3 border ${isDark ? 'border-white/8 bg-white/[0.03]' : 'border-gray-100 bg-gray-50/50'}`}>
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
                                                                <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                                                    {r.author?.name} · {timeAgo(r.created_at)}
                                                                </span>
                                                            </div>
                                                            <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                {r.message}
                                                            </p>
                                                            {r.document && (
                                                                <div className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-200/50 text-gray-600'}`}>
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                                    {r.document.filename}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handleResolve(r.id)}
                                                            disabled={resolveRemark.isPending}
                                                            className="shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold text-green-600 bg-green-500/10 hover:bg-green-500/20 transition-colors disabled:opacity-40"
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
                                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                        Resolved ({resolvedRemarks.length})
                                    </p>
                                    <div className="space-y-2">
                                        {resolvedRemarks.map(r => (
                                            <div key={r.id} className={`rounded-lg p-3 border opacity-60 ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/30'}`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                                        Resolved by {r.resolved_by?.name ?? 'Unknown'} · {r.resolved_at ? timeAgo(r.resolved_at) : ''}
                                                    </span>
                                                </div>
                                                <p className={`text-sm line-through ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {r.message}
                                                </p>
                                                {r.document && (
                                                    <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold opacity-60 ${isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200/50 text-gray-500'}`}>
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
