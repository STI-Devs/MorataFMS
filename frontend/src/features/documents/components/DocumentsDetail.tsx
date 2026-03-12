import { useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { Icon } from '../../../components/Icon';
import { FilePreviewModal } from '../../../components/modals/FilePreviewModal';
import { UploadModal } from '../../../components/modals/UploadModal';
import { getStatusStyle } from '../../../lib/statusStyles';
import { trackingApi } from '../../tracking/api/trackingApi';
import { useExports } from '../../tracking/hooks/useExports';
import { useImports } from '../../tracking/hooks/useImports';
import type { ApiDocument, DocumentableType, LayoutContext } from '../../tracking/types';
import { useDocuments } from '../hooks/useDocuments';
import { useUploadDocument } from '../hooks/useUploadDocument';


type DocFileType = 'pdf' | 'docx' | 'jpg' | 'png' | 'other';

interface TransactionDoc {
    id: number;
    name: string;
    fileType: DocFileType;
    date: string;
    uploader: { name: string; initials: string; avatarColor: string };
    size: string;
}


const TYPE_CONFIG = {
    import:  { label: 'Import',  color: '#0a84ff', bg: 'rgba(10,132,255,0.12)' },
    export:  { label: 'Export',  color: '#30d158', bg: 'rgba(48,209,88,0.12)'  },
    legacy:  { label: 'Legacy',  color: '#ff9f0a', bg: 'rgba(255,159,10,0.12)' },
};

const AVATAR_COLORS = [
    'bg-blue-500', 'bg-indigo-500', 'bg-emerald-500',
    'bg-violet-500', 'bg-amber-500', 'bg-rose-500',
    'bg-cyan-500', 'bg-teal-500',
];

function toTitleCase(str: string): string {
    if (!str || str === '\u2014') return str;
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(dateStr: string): string {
    if (!dateStr || dateStr === '\u2014') return dateStr;
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}


function getFileType(filename: string): DocFileType {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf')  return 'pdf';
    if (ext === 'docx') return 'docx';
    if (ext === 'jpg' || ext === 'jpeg') return 'jpg';
    if (ext === 'png')  return 'png';
    return 'other';
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('');
}

function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % AVATAR_COLORS.length;
    return AVATAR_COLORS[hash];
}

function formatBytes(bytes: number): string {
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildExportRef(id: number) {
    return `EXP-${String(id).padStart(4, '0')}`;
}

function mapDocument(doc: ApiDocument): TransactionDoc {
    const uploaderName = doc.uploaded_by?.name ?? 'Unknown';
    return {
        id:       doc.id,
        name:     doc.filename,
        fileType: getFileType(doc.filename),
        date:     doc.created_at.slice(0, 10),
        uploader: {
            name:        uploaderName,
            initials:    getInitials(uploaderName),
            avatarColor: getAvatarColor(uploaderName),
        },
        size: doc.formatted_size || formatBytes(doc.size_bytes),
    };
}


function FileTypeIcon({ type }: { type: DocFileType }) {
    const styles: Record<DocFileType, string> = {
        pdf:   'text-red-500 bg-red-50 dark:bg-red-900/20',
        docx:  'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
        jpg:   'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
        png:   'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
        other: 'text-text-secondary bg-surface-secondary',
    };
    const iconPaths: Record<DocFileType, string> = {
        pdf:   'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
        docx:  'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        jpg:   'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
        png:   'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
        other: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    };
    return (
        <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${styles[type]}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPaths[type]} />
            </svg>
        </div>
    );
}


export const DocumentsDetail = () => {
    const { ref } = useParams<{ ref: string }>();
    const navigate = useNavigate();
    const { dateTime } = useOutletContext<LayoutContext>();

    const [isUploadOpen, setIsUploadOpen]         = useState(false);
    const [uploadError, setUploadError]           = useState<string | undefined>();
    const [previewState, setPreviewState]         = useState<{ url: string; filename: string } | null>(null);

    const { data: importsData, isLoading: importsLoading } = useImports({ per_page: 100 });
    const { data: exportsData, isLoading: exportsLoading } = useExports({ per_page: 100 });
    const txnLoading = importsLoading || exportsLoading;

    const matchedImport = (importsData?.data ?? []).find(t => t.customs_ref_no === ref);
    const matchedExport = (exportsData?.data ?? []).find(t => buildExportRef(t.id) === ref);

    const isImport = !!matchedImport;
    const txnId    = matchedImport?.id ?? matchedExport?.id ?? 0;

    const documentableType: DocumentableType = isImport
        ? 'App\\Models\\ImportTransaction'
        : 'App\\Models\\ExportTransaction';

    const txnFound = !!(matchedImport || matchedExport);

    const { data: apiDocuments = [], isLoading: docsLoading } = useDocuments(
        documentableType,
        txnId,
        txnFound,
    );

    const documents: TransactionDoc[] = apiDocuments.map(mapDocument);

    const { mutate: uploadDocument, isPending: isUploading } = useUploadDocument();

    const handleUpload = (file: File) => {
        setUploadError(undefined);
        uploadDocument(
            {
                file,
                type:               file.name.split('.').pop() ?? 'file',
                documentable_type:  documentableType,
                documentable_id:    txnId,
            },
            {
                onSuccess: () => setIsUploadOpen(false),
                onError:   () => setUploadError('Upload failed. Please try again.'),
            },
        );
    };

    const handlePreview = async (docId: number, filename: string) => {
        const url = await trackingApi.getDocumentPreviewUrl(docId);
        setPreviewState({ url, filename });
    };

    const handlePreviewClose = () => {
        if (previewState?.url) URL.revokeObjectURL(previewState.url);
        setPreviewState(null);
    };

    const displayRef    = ref ?? '';
    const displayClient = matchedImport?.importer?.name ?? matchedExport?.shipper?.name ?? '—';
    const displayDate   = matchedImport?.arrival_date ?? matchedExport?.created_at.slice(0, 10) ?? '—';
    const displayStatus = matchedImport?.status ?? matchedExport?.status ?? '—';
    const displayType   = isImport ? 'import' : 'export';

    const backButton = (
        <button
            onClick={() => navigate('/documents')}
            className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors group"
        >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Documents
        </button>
    );

    if (txnLoading) {
        return (
            <div className="space-y-5 p-4">
                {backButton}
                <div className="flex items-center justify-center h-48 gap-3 text-text-muted">
                    <div className="w-5 h-5 rounded-full border-2 border-text-muted/30 border-t-text-muted animate-spin" />
                    <span className="text-sm font-semibold">Loading transaction…</span>
                </div>
            </div>
        );
    }

    if (!txnFound) {
        return (
            <div className="space-y-5 p-4">
                {backButton}
                <div className="flex flex-col items-center justify-center h-64 gap-3 text-text-muted">
                    <Icon name="file-text" className="w-10 h-10 opacity-30" />
                    <p className="text-sm font-semibold">
                        {ref ? `Transaction "${ref}" not found` : 'No transaction selected'}
                    </p>
                    <p className="text-xs">The reference may have been deleted or does not exist.</p>
                </div>
            </div>
        );
    }

    const tc = TYPE_CONFIG[displayType];
    const sc = getStatusStyle(displayStatus);

    return (
        <div className="space-y-5 p-4">

            {/* Back button */}
            {backButton}

            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h1 className="text-3xl font-bold text-text-primary">{displayRef}</h1>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold" style={{ color: tc.color, backgroundColor: tc.bg }}>
                            {tc.label}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold" style={{ color: sc.color, backgroundColor: sc.bg }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.color, boxShadow: `0 0 4px ${sc.color}` }} />
                            {displayStatus}
                        </span>
                    </div>
                    <p className="text-sm text-text-secondary">{toTitleCase(displayClient)} · {formatDate(displayDate)}</p>
                </div>
                <div className="text-right hidden sm:block shrink-0">
                    <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-sm text-text-secondary">{dateTime.date}</p>
                </div>
            </div>

            {/* Document List Card */}
            <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">

                {/* Card header */}
                <div className="px-6 py-4 border-b border-border bg-surface flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-bold text-text-primary">
                            {docsLoading ? 'Loading…' : `${documents.length} Document${documents.length !== 1 ? 's' : ''}`}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => { setUploadError(undefined); setIsUploadOpen(true); }}
                        className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 bg-gradient-to-r from-blue-600 to-indigo-600"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Upload
                    </button>
                </div>

                {/* Table header */}
                <div
                    className="grid gap-4 px-6 py-3 border-b border-border text-xs font-bold text-text-secondary uppercase tracking-wider bg-surface"
                    style={{ gridTemplateColumns: '40px 2.5fr 1fr 1.4fr 80px 90px' }}
                >
                    <span />
                    <span>File Name</span>
                    <span>Date</span>
                    <span>Uploaded By</span>
                    <span>Size</span>
                    <span className="text-center">Actions</span>
                </div>

                {/* Document rows */}
                <div>
                    {docsLoading ? (
                        <div className="flex items-center justify-center py-16 gap-3 text-text-muted">
                            <div className="w-5 h-5 rounded-full border-2 border-text-muted/30 border-t-text-muted animate-spin" />
                            <span className="text-sm font-semibold">Loading documents…</span>
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="py-16 flex flex-col items-center gap-3 text-text-muted">
                            <Icon name="file-text" className="w-10 h-10 opacity-30" />
                            <p className="text-sm font-semibold">No documents yet</p>
                            <p className="text-xs">Upload the first document for this transaction.</p>
                        </div>
                    ) : (
                        documents.map((doc, i) => (
                            <div
                                key={doc.id}
                                className={`grid gap-4 px-6 py-3.5 items-center border-b border-border/50 transition-colors hover:bg-hover ${i % 2 !== 0 ? 'bg-surface-secondary/40' : ''}`}
                                style={{ gridTemplateColumns: '40px 2.5fr 1fr 1.4fr 80px 90px' }}
                            >
                                <FileTypeIcon type={doc.fileType} />
                                <p className="text-sm font-semibold text-text-primary truncate">{doc.name}</p>
                                <p className="text-sm font-semibold text-text-secondary">{formatDate(doc.date)}</p>
                                <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${doc.uploader.avatarColor}`}>
                                        {doc.uploader.initials}
                                    </div>
                                    <span className="text-sm font-semibold text-text-secondary truncate">{doc.uploader.name}</span>
                                </div>
                                <p className="text-sm font-semibold text-text-secondary">{doc.size}</p>
                                <div className="flex items-center justify-center gap-1">
                                    {/* Download */}
                                    <button
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                        title="Download"
                                        onClick={() => trackingApi.downloadDocument(doc.id, doc.name)}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    </button>
                                    {/* Preview */}
                                    <button
                                        className="p-1.5 text-text-secondary hover:bg-hover rounded-md transition-colors"
                                        title="Preview"
                                        onClick={() => handlePreview(doc.id, doc.name)}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Upload modal */}
            <UploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                title={displayRef}
                onUpload={handleUpload}
                isLoading={isUploading}
                errorMessage={uploadError}
            />

            {/* File preview modal */}
            <FilePreviewModal
                isOpen={!!previewState}
                onClose={handlePreviewClose}
                file={previewState?.url ?? null}
                fileName={previewState?.filename}
            />
        </div>
    );
};
