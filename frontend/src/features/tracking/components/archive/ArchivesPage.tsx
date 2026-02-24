import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ConfirmationModal } from '../../../../components/ConfirmationModal';
import { Icon } from '../../../../components/Icon';
import type { LayoutContext } from '../../types';
import type { ArchiveYear } from '../../types/document.types';
import { ArchiveDocumentRow } from './ArchiveDocumentRow';
import { ArchiveLegacyUploadPage } from './ArchiveLegacyUploadPage';
import { ArchiveYearCard } from './ArchiveYearCard';

// ─── Mock data (replace with API when S3 is ready) ───────────────────────────

const MOCK_ARCHIVE: ArchiveYear[] = [
    {
        year: 2024, documents: [
            { id: 101, name: 'BL_Maersk_Jan2024.pdf', docType: 'Bill of Lading', type: 'import', client: 'Maersk Corp', refNo: 'IMP-2024-JAN-01', fileDate: 'Jan 5, 2024', uploadDate: 'Feb 1, 2025', uploader: { name: 'Alice Smith', initials: 'AS', color: '#c41e3a' }, size: '1.1 MB', ext: 'pdf' },
            { id: 102, name: 'Invoice_PacificQ1.pdf', docType: 'Commercial Invoice', type: 'export', client: 'Pacific Traders', refNo: 'EXP-2024-Q1', fileDate: 'Mar 10, 2024', uploadDate: 'Feb 1, 2025', uploader: { name: 'John Doe', initials: 'JD', color: '#1a2332' }, size: '930 KB', ext: 'pdf' },
        ],
    },
    {
        year: 2023, documents: [
            { id: 103, name: 'CustomsDecl_2023.docx', docType: 'Customs Declaration', type: 'import', client: 'Asia Freight', refNo: '', fileDate: 'Jun 15, 2023', uploadDate: 'Feb 1, 2025', uploader: { name: 'John Doe', initials: 'JD', color: '#1a2332' }, size: '750 KB', ext: 'docx' },
            { id: 104, name: 'COO_Manila2023.pdf', docType: 'Certificate of Origin', type: 'export', client: 'Manila Exports', refNo: 'EXP-2023-088', fileDate: 'Aug 22, 2023', uploadDate: 'Feb 1, 2025', uploader: { name: 'Alice Smith', initials: 'AS', color: '#c41e3a' }, size: '1.3 MB', ext: 'pdf' },
            { id: 105, name: 'PackingList_Globe.docx', docType: 'Packing List', type: 'import', client: 'Globe Cargo', refNo: 'IMP-2023-055', fileDate: 'Nov 3, 2023', uploadDate: 'Feb 1, 2025', uploader: { name: 'Robert Johnson', initials: 'RJ', color: '#3b82f6' }, size: '620 KB', ext: 'docx' },
        ],
    },
    {
        year: 2022, documents: [
            { id: 106, name: 'BL_2022_Archive.pdf', docType: 'Bill of Lading', type: 'import', client: 'Maersk Corp', refNo: 'IMP-2022-001', fileDate: 'Mar 8, 2022', uploadDate: 'Feb 1, 2025', uploader: { name: 'Alice Smith', initials: 'AS', color: '#c41e3a' }, size: '2.1 MB', ext: 'pdf' },
        ],
    },
];

const ARCHIVE_TABLE_COLS = ['File', 'Document Type', 'Type', 'Client', 'Ref No.', 'File Date', 'Size', 'Actions'];
// ─── Component ────────────────────────────────────────────────────────────────

export const ArchivesPage = () => {
    const { dateTime } = useOutletContext<LayoutContext>();

    const [archiveData, setArchiveData]           = useState<ArchiveYear[]>(MOCK_ARCHIVE);
    const [selectedYear, setSelectedYear]         = useState<ArchiveYear | null>(null);
    const [archiveSearch, setArchiveSearch]       = useState('');
    const [showLegacyUpload, setShowLegacyUpload] = useState(false);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean; title: string; message: string;
        confirmText?: string; confirmButtonClass?: string; onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    const openConfirm = (title: string, message: string, onConfirm: () => void) =>
        setConfirmModal({ isOpen: true, title, message, confirmText: 'Delete', confirmButtonClass: 'bg-red-600 hover:bg-red-700', onConfirm });

    const handleDeleteArchiveDoc = (docId: number) =>
        openConfirm('Delete Archive Document', 'This will permanently remove this legacy document. Continue?', () => {
            setArchiveData(prev => prev.map(y => ({ ...y, documents: y.documents.filter(d => d.id !== docId) })));
            setSelectedYear(prev => prev ? { ...prev, documents: prev.documents.filter(d => d.id !== docId) } : null);
        });

    const filteredArchive = (selectedYear?.documents ?? [])
        .filter(d =>
            d.client.toLowerCase().includes(archiveSearch.toLowerCase()) ||
            d.refNo.toLowerCase().includes(archiveSearch.toLowerCase()) ||
            d.name.toLowerCase().includes(archiveSearch.toLowerCase())
        );

    const totalDocs = archiveData.reduce((s, y) => s + y.documents.length, 0);

    // ── Legacy upload sub-page ─────────────────────────────────────────────────
    if (showLegacyUpload) {
        return (
            <ArchiveLegacyUploadPage
                defaultYear={selectedYear?.year ?? 2024}
                onBack={() => setShowLegacyUpload(false)}
                onSubmit={() => setShowLegacyUpload(false)}
            />
        );
    }

    // ── Year drill-down ────────────────────────────────────────────────────────
    if (selectedYear) {
        return (
            <div className="space-y-5 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedYear(null)} className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors">
                            <Icon name="chevron-left" className="w-4 h-4" /> Archives
                        </button>
                        <span className="text-text-muted">/</span>
                        <span className="text-xs font-bold text-text-primary">{selectedYear.year}</span>
                    </div>
                    <div className="text-right hidden sm:block">
                        <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                        <p className="text-sm text-text-secondary">{dateTime.date}</p>
                    </div>
                </div>

                {/* Year header card */}
                <div className="bg-surface rounded-lg border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(255,159,10,0.1)' }}>
                        <Icon name="clock" className="w-6 h-6" stroke="#ff9f0a" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-text-primary mb-0.5">{selectedYear.year} Archive</h2>
                        <p className="text-sm text-text-muted">{selectedYear.documents.length} legacy documents</p>
                    </div>
                    <button onClick={() => setShowLegacyUpload(true)}
                        className="flex items-center gap-1.5 px-3.5 h-9 rounded-md text-xs font-bold shadow-sm shrink-0 text-white"
                        style={{ backgroundColor: '#ff9f0a' }}>
                        <Icon name="plus" className="w-3.5 h-3.5" /> Upload Legacy File
                    </button>
                </div>

                {/* Document table */}
                <div className="bg-surface rounded-lg border border-border overflow-hidden">
                    <div className="p-3 border-b border-border bg-surface-subtle flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                        <p className="text-sm font-bold text-text-primary">{filteredArchive.length} Documents</p>
                        <div className="relative flex-1 max-w-xs">
                            <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input type="text" placeholder="Search by client, ref, file..." value={archiveSearch}
                                onChange={e => setArchiveSearch(e.target.value)}
                                className="w-full pl-9 pr-3 h-9 rounded-md border border-border-strong bg-input-bg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition-colors" />
                        </div>
                    </div>

                    {filteredArchive.length === 0 ? (
                        <div className="py-16 flex flex-col items-center gap-3 text-text-muted">
                            <Icon name="file-text" className="w-10 h-10 opacity-30" />
                            <p className="text-sm font-semibold">No documents for {selectedYear.year}</p>
                            <p className="text-xs">Upload legacy files to start building this year's archive.</p>
                        </div>
                    ) : (
                        <div className="px-4">
                            <div className="grid items-center gap-4 py-2.5 border-b border-border"
                                style={{ gridTemplateColumns: '32px 2fr 1.2fr 1fr 1fr 1fr 80px 80px' }}>
                                {ARCHIVE_TABLE_COLS.map(h => (
                                    <span key={h} className="text-[11px] font-bold text-text-muted uppercase tracking-wider last:text-right">{h}</span>
                                ))}
                            </div>
                            {filteredArchive.map(doc => (
                                <ArchiveDocumentRow key={doc.id} doc={doc} onDelete={handleDeleteArchiveDoc} />
                            ))}
                        </div>
                    )}
                </div>

                <ConfirmationModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal(m => ({ ...m, isOpen: false }))}
                    onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message}
                    confirmText={confirmModal.confirmText} confirmButtonClass={confirmModal.confirmButtonClass} />
            </div>
        );
    }

    // ── Main archive list ──────────────────────────────────────────────────────
    return (
        <div className="space-y-5 p-4">
            {/* Page header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-1 text-text-primary">Archives</h1>
                    <p className="text-sm text-text-secondary">Legacy documents from 2022 – 2025 physical records</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-sm text-text-secondary">{dateTime.date}</p>
                </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                    { label: 'Archive Years', value: archiveData.length, color: '#ff9f0a', icon: 'clock' as const },
                    { label: 'Total Documents', value: totalDocs, color: '#64d2ff', icon: 'file-text' as const },
                    { label: 'Latest Year', value: Math.max(...archiveData.map(y => y.year)), color: '#30d158', icon: 'check-circle' as const },
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

            {/* Year list */}
            <div className="bg-surface rounded-lg border border-border overflow-hidden">
                <div className="p-3 border-b border-border bg-surface-subtle flex items-center justify-between">
                    <p className="text-sm font-bold text-text-primary">{archiveData.length} Archive Years</p>
                    <button onClick={() => setShowLegacyUpload(true)}
                        className="flex items-center gap-1.5 px-3.5 h-9 rounded-md text-xs font-bold shadow-sm text-white"
                        style={{ backgroundColor: '#ff9f0a' }}>
                        <Icon name="plus" className="w-3.5 h-3.5" /> Upload Legacy File
                    </button>
                </div>

                <div className="p-4 space-y-2">
                    {archiveData.length === 0 ? (
                        <div className="py-12 flex flex-col items-center gap-3 text-text-muted">
                            <Icon name="clock" className="w-10 h-10 opacity-30" />
                            <p className="text-sm font-semibold">No archive data yet</p>
                            <p className="text-xs">Start uploading legacy documents to build the archive.</p>
                        </div>
                    ) : (
                        archiveData.map(yr => (
                            <ArchiveYearCard key={yr.year} archive={yr} onClick={() => setSelectedYear(yr)} />
                        ))
                    )}
                </div>
            </div>

            <ConfirmationModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal(m => ({ ...m, isOpen: false }))}
                onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message}
                confirmText={confirmModal.confirmText} confirmButtonClass={confirmModal.confirmButtonClass} />
        </div>
    );
};
