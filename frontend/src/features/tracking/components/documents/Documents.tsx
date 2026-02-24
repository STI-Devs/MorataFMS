import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ConfirmationModal } from '../../../../components/ConfirmationModal';
import { Icon } from '../../../../components/Icon';
import { trackingApi } from '../../api/trackingApi';
import { useDeleteDocument } from '../../hooks/useDeleteDocument';
import { useDocuments } from '../../hooks/useDocuments';
import { useExports } from '../../hooks/useExports';
import { useImports } from '../../hooks/useImports';
import { useUploadDocument } from '../../hooks/useUploadDocument';
import type { ApiDocument, ApiExportTransaction, ApiImportTransaction, DocumentableType, LayoutContext, TransactionType } from '../../types';
import { UploadModal } from '../modals/UploadModal';
import { DocumentRow } from './DocumentRow';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NormalizedTransaction {
    id: number;
    type: TransactionType;
    ref: string;
    client: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    date: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    pending:     { label: 'Pending',     color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' },
    in_progress: { label: 'In Progress', color: '#64d2ff', bg: 'rgba(100,210,255,0.13)' },
    completed:   { label: 'Completed',   color: '#30d158', bg: 'rgba(48,209,88,0.13)' },
    cancelled:   { label: 'Cancelled',   color: '#ff453a', bg: 'rgba(255,69,58,0.13)' },
};

const DOC_TABLE_COLS = ['File', 'Document Type', 'Uploaded', 'By', 'Size', 'Actions'];

// ─── Normalizers ──────────────────────────────────────────────────────────────

const normalizeImport = (t: ApiImportTransaction): NormalizedTransaction => ({
    id: t.id,
    type: 'import',
    ref: t.customs_ref_no,
    client: t.importer?.name || 'Unknown',
    status: t.status as NormalizedTransaction['status'],
    date: t.arrival_date || t.created_at?.slice(0, 10) || '',
});

const normalizeExport = (t: ApiExportTransaction): NormalizedTransaction => ({
    id: t.id,
    type: 'export',
    ref: `EXP-${String(t.id).padStart(4, '0')}`,
    client: t.shipper?.name || 'Unknown',
    status: t.status as NormalizedTransaction['status'],
    date: t.created_at?.slice(0, 10) || '',
});

// ─── Transaction Documents Sub-view ───────────────────────────────────────────

const TransactionDocuments = ({
    tx,
    onBack,
}: {
    tx: NormalizedTransaction;
    onBack: () => void;
}) => {
    const { dateTime } = useOutletContext<LayoutContext>();
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean; title: string; message: string; onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    const documentableType: DocumentableType = tx.type === 'import'
        ? 'App\\Models\\ImportTransaction'
        : 'App\\Models\\ExportTransaction';

    const { data: documents = [], isLoading } = useDocuments(documentableType, tx.id);
    const uploadMutation = useUploadDocument();
    const deleteMutation = useDeleteDocument();

    const handleUpload = (file: File) => {
        uploadMutation.mutate(
            {
                file,
                type: 'other',
                documentable_type: documentableType,
                documentable_id: tx.id,
            },
            { onSuccess: () => setIsUploadOpen(false) },
        );
    };

    const handleDownload = (doc: ApiDocument) => {
        trackingApi.downloadDocument(doc.id, doc.filename);
    };

    const handleDelete = (doc: ApiDocument) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Document',
            message: `Are you sure you want to delete "${doc.filename}"? This action cannot be undone.`,
            onConfirm: () => deleteMutation.mutate(doc.id),
        });
    };

    const s = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.pending;
    const isImport = tx.type === 'import';

    return (
        <div className="space-y-5 p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors">
                        <Icon name="chevron-left" className="w-4 h-4" /> Documents
                    </button>
                    <span className="text-text-muted">/</span>
                    <span className="text-xs font-bold text-text-primary">{tx.ref}</span>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-sm text-text-secondary">{dateTime.date}</p>
                </div>
            </div>

            <div className="bg-surface rounded-lg border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: isImport ? 'rgba(48,209,88,0.1)' : 'rgba(10,132,255,0.1)' }}>
                    <Icon name={isImport ? 'download' : 'truck'} className="w-6 h-6" stroke={isImport ? '#30d158' : '#0a84ff'} />
                </div>
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold text-text-primary">{tx.ref}</h2>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold" style={{ color: s.color, backgroundColor: s.bg }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />{s.label}
                        </span>
                    </div>
                    <p className="text-sm text-text-muted">{tx.client} · {tx.date}</p>
                </div>
                <button onClick={() => setIsUploadOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 h-9 rounded-md text-xs font-bold shadow-sm shrink-0 text-white"
                    style={{ backgroundColor: '#0a84ff' }}>
                    <Icon name="plus" className="w-3.5 h-3.5" /> Upload Document
                </button>
            </div>

            <div className="bg-surface rounded-lg border border-border overflow-hidden">
                <div className="p-3 border-b border-border bg-surface-subtle">
                    <p className="text-sm font-bold text-text-primary">
                        {isLoading ? 'Loading...' : `${documents.length} ${documents.length === 1 ? 'Document' : 'Documents'}`}
                    </p>
                </div>
                {!isLoading && documents.length === 0 ? (
                    <div className="py-16 flex flex-col items-center gap-3 text-text-muted">
                        <Icon name="file-text" className="w-10 h-10 opacity-30" />
                        <p className="text-sm font-semibold">No documents yet</p>
                        <p className="text-xs">Upload the first document for this transaction.</p>
                    </div>
                ) : (
                    <div className="px-4">
                        <div className="grid items-center gap-4 py-2.5 border-b border-border"
                            style={{ gridTemplateColumns: '32px 2fr 1.2fr 1fr 80px 80px' }}>
                            {DOC_TABLE_COLS.map(h => (
                                <span key={h} className="text-[11px] font-bold text-text-muted uppercase tracking-wider last:text-right">{h}</span>
                            ))}
                        </div>
                        {documents.map(doc => (
                            <DocumentRow key={doc.id} doc={doc} onDownload={handleDownload} onDelete={handleDelete} />
                        ))}
                    </div>
                )}
            </div>

            <UploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onUpload={handleUpload}
                title={tx.ref}
                isLoading={uploadMutation.isPending}
                errorMessage={uploadMutation.isError ? (uploadMutation.error as Error).message : undefined}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(m => ({ ...m, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText="Delete"
                confirmButtonClass="bg-red-600 hover:bg-red-700"
            />
        </div>
    );
};

// ─── TransactionCard (inline) ────────────────────────────────────────────────

const TransactionListCard = ({
    tx,
    onClick,
}: {
    tx: NormalizedTransaction;
    onClick: () => void;
}) => {
    const s = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.pending;
    const isImport = tx.type === 'import';

    return (
        <button
            onClick={onClick}
            className="w-full text-left bg-surface-secondary border border-border rounded-lg p-4 hover:border-border-strong hover:bg-hover transition-all group"
        >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: isImport ? 'rgba(48,209,88,0.1)' : 'rgba(10,132,255,0.1)' }}>
                    <Icon name={isImport ? 'download' : 'truck'} className="w-5 h-5" stroke={isImport ? '#30d158' : '#0a84ff'} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-text-primary">{tx.ref}</p>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: s.color, backgroundColor: s.bg }}>
                            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: s.color }} />{s.label}
                        </span>
                    </div>
                    <p className="text-xs text-text-muted truncate">{tx.client} · {tx.date}</p>
                </div>
                <Icon name="chevron-right" className="w-4 h-4 text-text-muted group-hover:text-text-primary transition-colors" />
            </div>
        </button>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const Documents = () => {
    const { dateTime } = useOutletContext<LayoutContext>();

    const [activeTab, setActiveTab]       = useState<TransactionType>('import');
    const [selectedTx, setSelectedTx]     = useState<NormalizedTransaction | null>(null);
    const [txSearch, setTxSearch]         = useState('');

    // Fetch real transactions
    const { data: importsData } = useImports({ per_page: 100 });
    const { data: exportsData } = useExports({ per_page: 100 });

    const importTransactions = (importsData?.data ?? []).map(normalizeImport);
    const exportTransactions = (exportsData?.data ?? []).map(normalizeExport);
    const allTransactions = [...importTransactions, ...exportTransactions];

    const filteredTx = allTransactions
        .filter(tx => tx.type === activeTab)
        .filter(tx =>
            tx.ref.toLowerCase().includes(txSearch.toLowerCase()) ||
            tx.client.toLowerCase().includes(txSearch.toLowerCase()),
        );

    // ── Drill-down ──────────────────────────────────────────────────────
    if (selectedTx) {
        return <TransactionDocuments tx={selectedTx} onBack={() => setSelectedTx(null)} />;
    }

    // ── Main list view ──────────────────────────────────────────────────
    return (
        <div className="space-y-5 p-4">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-1 text-text-primary">Documents</h1>
                    <p className="text-sm text-text-secondary">Browse documents organized by transaction</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-sm text-text-secondary">{dateTime.date}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Import Transactions', value: importTransactions.length, color: '#30d158', icon: 'download' as const },
                    { label: 'Export Transactions', value: exportTransactions.length, color: '#0a84ff', icon: 'truck' as const },
                    { label: 'Total Imports',       value: importTransactions.length, color: '#ff9f0a', icon: 'file-text' as const },
                    { label: 'Total Exports',       value: exportTransactions.length, color: '#64d2ff', icon: 'file-text' as const },
                ].map(stat => (
                    <div key={stat.label} className="bg-surface-tint border border-border-tint rounded-lg p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-2xl font-bold tabular-nums text-text-primary">{stat.value}</p>
                                <p className="text-xs mt-1 text-text-secondary">{stat.label}</p>
                            </div>
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}20` }}>
                                <Icon name={stat.icon} className="w-4 h-4" stroke={stat.color} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tab + search toolbar */}
            <div className="bg-surface rounded-lg border border-border overflow-hidden">
                <div className="p-3 border-b border-border bg-surface-subtle flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div className="flex items-center gap-1 bg-surface border border-border-strong rounded-md p-0.5">
                        {[
                            { id: 'import' as const, label: 'Imports', icon: 'download' as const, color: '#30d158', count: importTransactions.length },
                            { id: 'export' as const, label: 'Exports', icon: 'truck' as const,    color: '#0a84ff', count: exportTransactions.length },
                        ].map(tab => (
                            <button key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setTxSearch(''); }}
                                className={`flex items-center gap-1.5 px-3 h-7 rounded text-xs font-bold capitalize transition-all ${activeTab === tab.id ? 'text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                                style={activeTab === tab.id ? { backgroundColor: tab.color } : {}}>
                                <Icon name={tab.icon} className="w-3 h-3" />
                                {tab.label}
                                <span className={`ml-0.5 px-1.5 rounded-full text-[10px] font-bold ${activeTab === tab.id ? 'bg-white/20' : 'bg-surface-secondary text-text-muted'}`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="relative flex-1 max-w-xs">
                        <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input type="text" placeholder={`Search ${activeTab}s...`} value={txSearch}
                            onChange={e => setTxSearch(e.target.value)}
                            className="w-full pl-9 pr-3 h-9 rounded-md border border-border-strong bg-input-bg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition-colors" />
                    </div>
                </div>

                <div className="p-4 space-y-2">
                    {filteredTx.length === 0 ? (
                        <div className="py-12 flex flex-col items-center gap-3 text-text-muted">
                            <Icon name="file-text" className="w-10 h-10 opacity-30" />
                            <p className="text-sm font-semibold">No transactions found</p>
                        </div>
                    ) : (
                        filteredTx.map(tx => (
                            <TransactionListCard key={`${tx.type}-${tx.id}`} tx={tx} onClick={() => setSelectedTx(tx)} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
