import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../../components/Icon';
import { FilePreviewModal } from '../../../components/modals/FilePreviewModal';
import { trackingApi } from '../../tracking/api/trackingApi';
import { useDocumentPreview } from '../../tracking/hooks/useDocumentPreview';
import { useCreateRemark, useDocuments, useRemarks, useResolveRemark } from '../hooks/useRemarks';
import type { CreateRemarkData, Remark, RemarkDocument } from '../types/remark.types';
import type { OversightTransaction } from '../types/transaction.types';
import { StagePipeline } from './StagePipeline';

// ─── Config ──────────────────────────────────────────────────────────────────

const SEVERITY_CFG = {
    info:     { label: 'Info',     color: '#0a84ff', bg: 'rgba(10,132,255,0.12)' },
    warning:  { label: 'Warning',  color: '#ff9f0a', bg: 'rgba(255,159,10,0.12)' },
    critical: { label: 'Critical', color: '#ff453a', bg: 'rgba(255,69,58,0.12)' },
} as const;

const TABS = ['Documents', 'Stages', 'Remarks'] as const;
type Tab = typeof TABS[number];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    transaction: OversightTransaction | null;
    onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const TransactionDetailDrawer = ({ transaction, onClose }: Props) => {
    const [activeTab, setActiveTab] = useState<Tab>('Documents');
    const { previewFile, setPreviewFile, handlePreviewDoc } = useDocumentPreview();
    const [previewLoading, setPreviewLoading] = useState<number | null>(null);
    const drawerRef = useRef<HTMLDivElement>(null);

    // Remark form state
    const [severity, setSeverity] = useState<CreateRemarkData['severity']>('warning');
    const [message, setMessage] = useState('');
    const [documentId, setDocumentId] = useState<number | null>(null);

    const isOpen = !!transaction;
    const type = transaction?.type ?? 'import';
    const id = transaction?.id ?? null;

    // Data — use oversight's useDocuments which takes 'import'|'export' directly
    const { data: docsResult, isLoading: docsLoading } = useDocuments(type, id, isOpen);
    const documents: RemarkDocument[] = docsResult?.data ?? [];
    const { data: remarksResult, isLoading: remarksLoading } = useRemarks(type, id, isOpen);
    const remarks: Remark[] = remarksResult?.data ?? [];
    const createRemark = useCreateRemark();
    const resolveRemark = useResolveRemark(type, id);

    // Reset tab & form when drawer opens with a new transaction
    useEffect(() => {
        if (isOpen) {
            setActiveTab('Documents');
            setSeverity('warning');
            setMessage('');
            setDocumentId(null);
        }
    }, [transaction?.id]);

    // Escape key closes drawer
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    const handlePreview = async (docId: number, filename: string) => {
        setPreviewLoading(docId);
        try {
            // Reconstruct the minimal ApiDocument shape required by handlePreviewDoc
            await handlePreviewDoc({ id: docId, filename } as import('../../tracking/types').ApiDocument);
        } finally {
            setPreviewLoading(null);
        }
    };

    const handleDownload = (docId: number, filename: string) => {
        trackingApi.downloadDocument(docId, filename);
    };

    const handleCreateRemark = async () => {
        if (!id || !message.trim()) return;
        await createRemark.mutateAsync({
            type,
            id,
            data: { severity, message: message.trim(), document_id: documentId },
        });
        setMessage('');
        setDocumentId(null);
    };

    const transactionLabel = transaction
        ? `${transaction.type === 'import' ? 'Import' : 'Export'} — ${transaction.reference_no || transaction.bl_no || `#${transaction.id}`}`
        : '';

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div
                ref={drawerRef}
                className={`fixed top-0 right-0 h-full z-50 flex flex-col bg-surface border-l border-border shadow-2xl transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}
                `}
                style={{ width: 'min(640px, 100vw)' }}
            >
                {transaction && (
                    <>
                        {/* ── Header ──────────────────────────────────────────── */}
                        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border shrink-0">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span
                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold capitalize"
                                        style={{
                                            color: transaction.type === 'import' ? '#0a84ff' : '#ff9f0a',
                                            backgroundColor: transaction.type === 'import' ? 'rgba(10,132,255,0.13)' : 'rgba(255,159,10,0.13)',
                                        }}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: transaction.type === 'import' ? '#0a84ff' : '#ff9f0a' }} />
                                        {transaction.type}
                                    </span>
                                    {transaction.open_remarks_count > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold"
                                            style={{ color: '#ff453a', backgroundColor: 'rgba(255,69,58,0.12)' }}>
                                            <Icon name="flag" className="w-3 h-3" />
                                            {transaction.open_remarks_count} open
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-lg font-bold text-text-primary leading-tight truncate">{transactionLabel}</h2>
                                <p className="text-xs text-text-muted mt-0.5">
                                    {transaction.client || 'No client'} · {transaction.assigned_to || 'Unassigned'} · {transaction.date ? new Date(transaction.date).toLocaleDateString() : '—'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-hover transition-all shrink-0"
                                title="Close"
                            >
                                <Icon name="x" className="w-5 h-5" />
                            </button>
                        </div>

                        {/* ── Tabs ────────────────────────────────────────────── */}
                        <div className="flex gap-0 px-6 pt-3 border-b border-border shrink-0">
                            {TABS.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors mr-1 ${
                                        activeTab === tab
                                            ? 'border-blue-500 text-blue-500'
                                            : 'border-transparent text-text-muted hover:text-text-primary'
                                    }`}
                                >
                                    {tab}
                                    {tab === 'Remarks' && transaction.open_remarks_count > 0 && (
                                        <span className="ml-1.5 text-[10px] font-bold text-red-500">
                                            ({transaction.open_remarks_count})
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* ── Tab Content ─────────────────────────────────────── */}
                        <div className="flex-1 overflow-y-auto">

                            {/* Documents Tab */}
                            {activeTab === 'Documents' && (
                                <div className="p-6 space-y-2">
                                    {docsLoading ? (
                                        <div className="flex items-center justify-center py-16">
                                            <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                                        </div>
                                    ) : documents.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <div className="w-14 h-14 rounded-2xl bg-surface-secondary border border-border flex items-center justify-center mb-3">
                                                <Icon name="file-text" className="w-7 h-7 text-text-muted" />
                                            </div>
                                            <p className="text-sm font-semibold text-text-muted">No documents uploaded yet</p>
                                            <p className="text-xs text-text-muted mt-1">The encoder has not uploaded any documents for this transaction.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                                                {documents.length} Document{documents.length !== 1 ? 's' : ''}
                                            </p>
                                            {documents.map(doc => (
                                                <div
                                                    key={doc.id}
                                                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface-secondary/30 hover:bg-hover transition-colors group"
                                                >
                                                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                                                        <Icon name="file-text" className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-text-primary truncate">{doc.filename}</p>
                                                        <p className="text-xs text-text-muted capitalize">{doc.type?.replace(/_/g, ' ')}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handlePreview(doc.id, doc.filename)}
                                                            disabled={previewLoading === doc.id}
                                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                                                            title="Preview"
                                                        >
                                                            {previewLoading === doc.id ? (
                                                                <div className="w-3 h-3 rounded-full border border-blue-500 border-t-transparent animate-spin" />
                                                            ) : (
                                                                <Icon name="eye" className="w-3.5 h-3.5" />
                                                            )}
                                                            Preview
                                                        </button>
                                                        <button
                                                            onClick={() => handleDownload(doc.id, doc.filename)}
                                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border hover:bg-hover transition-colors"
                                                            title="Download"
                                                        >
                                                            <Icon name="download" className="w-3.5 h-3.5" />
                                                            Download
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Stages Tab */}
                            {activeTab === 'Stages' && (
                                <div className="p-6">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">Stage Progress</p>
                                    {transaction.stages ? (
                                        <div className="p-4 rounded-xl border border-border bg-surface-secondary/30">
                                            <StagePipeline transaction={transaction} />
                                        </div>
                                    ) : (
                                        <p className="text-sm text-text-muted">No stage data available.</p>
                                    )}
                                </div>
                            )}

                            {/* Remarks Tab */}
                            {activeTab === 'Remarks' && (
                                <div className="p-6 flex flex-col gap-5">

                                    {/* Add Remark Form */}
                                    <div className="rounded-xl border border-border bg-surface-secondary/30 p-4 space-y-3">
                                        <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Add Remark</p>

                                        {/* Severity */}
                                        <div className="flex gap-2">
                                            {(Object.entries(SEVERITY_CFG) as [string, typeof SEVERITY_CFG['info']][]).map(([key, cfg]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => setSeverity(key as CreateRemarkData['severity'])}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all"
                                                    style={severity === key
                                                        ? { color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.color }
                                                        : { color: 'var(--text-muted)', backgroundColor: 'transparent', borderColor: 'var(--border)' }
                                                    }
                                                >
                                                    {cfg.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Optional: Pin to document — always visible so admin knows the feature exists */}
                                        <div>
                                            <label className="text-xs text-text-muted mb-1 block">
                                                Pin to document
                                                <span className="ml-1 font-normal opacity-60">(optional)</span>
                                            </label>
                                            {documents.length > 0 ? (
                                                <select
                                                    value={documentId ?? ''}
                                                    onChange={e => setDocumentId(e.target.value ? Number(e.target.value) : null)}
                                                    className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">No specific document</option>
                                                    {documents.map(doc => (
                                                        <option key={doc.id} value={doc.id}>{doc.filename}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="w-full rounded-lg border border-border border-dashed bg-surface-secondary/40 px-3 py-2 text-xs text-text-muted italic">
                                                    No documents uploaded yet.
                                                </div>
                                            )}
                                        </div>

                                        {/* Message */}
                                        <textarea
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            placeholder="Describe the issue clearly for the encoder…"
                                            rows={3}
                                            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        />

                                        <button
                                            onClick={handleCreateRemark}
                                            disabled={!message.trim() || createRemark.isPending}
                                            className="w-full py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                                            style={{ backgroundColor: '#ff453a', color: '#fff' }}
                                        >
                                            {createRemark.isPending ? 'Submitting…' : '🚩 Flag this Transaction'}
                                        </button>
                                    </div>

                                    {/* Existing Remarks */}
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Remark History</p>
                                        {remarksLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                                            </div>
                                        ) : remarks.length === 0 ? (
                                            <p className="text-sm text-text-muted text-center py-6">No remarks yet.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {remarks.map((r) => {
                                                    const scfg = SEVERITY_CFG[r.severity as keyof typeof SEVERITY_CFG] ?? SEVERITY_CFG.info;
                                                    return (
                                                        <div key={r.id} className={`p-3.5 rounded-xl border transition-all ${r.is_resolved ? 'border-border opacity-60' : 'border-border'}`}
                                                            style={!r.is_resolved ? { borderLeftWidth: 3, borderLeftColor: scfg.color } : {}}>
                                                            <div className="flex items-start justify-between gap-3 mb-1.5">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-xs font-bold px-2 py-0.5 rounded-md"
                                                                        style={{ color: scfg.color, backgroundColor: scfg.bg }}>
                                                                        {scfg.label}
                                                                    </span>
                                                                    {r.is_resolved && (
                                                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md"
                                                                            style={{ color: '#30d158', backgroundColor: 'rgba(48,209,88,0.12)' }}>
                                                                            ✓ Resolved
                                                                        </span>
                                                                    )}
                                                                    {r.document && (
                                                                        <span className="text-xs text-text-muted flex items-center gap-1">
                                                                            <Icon name="paperclip" className="w-3 h-3" />
                                                                            {r.document.filename}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {!r.is_resolved && (
                                                                    <button
                                                                        onClick={() => resolveRemark.mutate(r.id)}
                                                                        disabled={resolveRemark.isPending}
                                                                        className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-border hover:bg-hover transition-colors shrink-0 disabled:opacity-50"
                                                                    >
                                                                        Mark Done
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-text-primary">{r.message}</p>
                                                            <p className="text-[11px] text-text-muted mt-1.5">
                                                                {r.author?.name ?? 'System'} · {new Date(r.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                                                                {r.resolved_by && ` · Resolved by ${r.resolved_by.name}`}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* File Preview Modal */}
            <FilePreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                file={previewFile?.file ?? null}
                fileName={previewFile?.name ?? ''}
                onDownload={previewFile ? () => {
                    const doc = documents.find(d => d.filename === previewFile.name);
                    if (doc) handleDownload(doc.id, doc.filename);
                } : undefined}
            />
        </>
    );
};
