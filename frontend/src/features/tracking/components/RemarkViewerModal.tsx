import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../context/ThemeContext';
import { remarkApi } from '../../oversight/api/remarkApi';
import type { Remark } from '../../oversight/types/remark.types';
import { trackingKeys } from '../utils/queryKeys';

const SEVERITY_CFG = {
    info: { label: 'Info', color: '#0a84ff', bg: 'rgba(10,132,255,0.12)' },
    warning: { label: 'Warning', color: '#ff9f0a', bg: 'rgba(255,159,10,0.12)' },
    critical: { label: 'Critical', color: '#ff453a', bg: 'rgba(255,69,58,0.12)' },
} as const;

interface RemarkViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionType: 'import' | 'export';
    transactionId: number;
    transactionLabel: string;
}

export const RemarkViewerModal = ({ isOpen, onClose, transactionType, transactionId, transactionLabel }: RemarkViewerModalProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const qc = useQueryClient();

    const { data: remarksData, isLoading } = useQuery({
        queryKey: ['remarks', transactionType, transactionId],
        queryFn: () => remarkApi.getRemarks(transactionType, transactionId),
        enabled: isOpen,
    });

    const resolveRemark = useMutation({
        mutationFn: (remarkId: number) => remarkApi.resolveRemark(remarkId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['remarks', transactionType, transactionId] });
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
                className={`w-full max-w-lg rounded-2xl max-h-[80vh] flex flex-col animate-modal-in ${isDark ? 'bg-[#1c1c1e]' : 'bg-white'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <div>
                        <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Admin Remarks</h2>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{transactionLabel}</p>
                    </div>
                    <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                        <svg className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Remarks list */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#0a84ff' }} />
                        </div>
                    ) : openRemarks.length === 0 && resolvedRemarks.length === 0 ? (
                        <p className={`text-sm text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            No remarks for this transaction.
                        </p>
                    ) : (
                        <>
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
                                                        {r.author?.name} · {formatTimestamp(r.created_at)}
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
                                                onClick={() => resolveRemark.mutate(r.id)}
                                                disabled={resolveRemark.isPending}
                                                className="shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold text-green-600 bg-green-500/10 hover:bg-green-500/20 transition-colors disabled:opacity-40"
                                            >
                                                Mark Done
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {resolvedRemarks.length > 0 && (
                                <div>
                                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 mt-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                        Resolved ({resolvedRemarks.length})
                                    </p>
                                    {resolvedRemarks.map(r => (
                                        <div key={r.id} className={`rounded-lg p-3 border opacity-50 mb-2 ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/30'}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                                    Resolved by {r.resolved_by?.name ?? 'Unknown'}
                                                </span>
                                            </div>
                                            <p className={`text-sm line-through ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{r.message}</p>
                                            {r.document && (
                                                <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold opacity-60 ${isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200/50 text-gray-500'}`}>
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

