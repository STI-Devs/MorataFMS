import { trackingApi } from '../../api/trackingApi';
import type { ArchiveDocument } from '../../types/document.types';

// ─── Stage label map ──────────────────────────────────────────────────────────
const STAGE_LABELS: Record<string, string> = {
    boc:           'BOC Processing',
    ppa:           'PPA Processing',
    do:            'DO Request',
    port_charges:  'Port Charges',
    releasing:     'Releasing',
    billing:       'Billing',
    bl_generation: 'BL Generation',
    co:            'CO Processing',
    dccci:         'DCCCI Printing',
};

// ─── Stage badge color map ────────────────────────────────────────────────────
const STAGE_COLORS: Record<string, { color: string; bg: string }> = {
    boc:           { color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
    ppa:           { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    do:            { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    port_charges:  { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    releasing:     { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    billing:       { color: '#ff9f0a', bg: 'rgba(255,159,10,0.1)' },
    bl_generation: { color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
    co:            { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    dccci:         { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const extFromFilename = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';

const extStyle = (ext: string) => {
    if (ext === 'pdf')  return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    if (ext === 'docx') return { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
    return                     { color: '#f97316', bg: 'rgba(249,115,22,0.1)' };
};

const formatDate = (iso: string) => {
    try {
        return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return iso;
    }
};

const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
    doc: ArchiveDocument;
    onDelete: (id: number) => void;
}

export const ArchiveDocumentRow = ({ doc, onDelete }: Props) => {
    const ext      = extFromFilename(doc.filename);
    const c        = extStyle(ext);
    const stageKey = doc.stage in STAGE_COLORS ? doc.stage : '_';
    const sc       = STAGE_COLORS[stageKey] ?? { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' };
    const stage    = STAGE_LABELS[doc.stage] ?? doc.stage;
    const initials = doc.uploader ? getInitials(doc.uploader.name) : '??';

    const handleDownload = () => trackingApi.downloadDocument(doc.id, doc.filename);

    return (
        <div className="grid items-center gap-4 px-4 py-3.5 border-b border-border/40 hover:bg-hover transition-colors"
            style={{ gridTemplateColumns: '32px 1fr 1.4fr 80px 32px 56px' }}>

            {/* File type icon */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: c.bg }}>
                <svg className="w-4 h-4" fill="none" stroke={c.color} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            </div>

            {/* Filename + ext/size */}
            <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate" title={doc.filename}>
                    {doc.filename}
                </p>
                <p className="text-[10px] text-text-muted mt-0.5 font-mono">
                    {ext.toUpperCase()} · {doc.formatted_size}
                </p>
            </div>

            {/* Stage pill */}
            <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-md text-[10px] font-semibold truncate"
                style={{ color: sc.color, backgroundColor: sc.bg }}>
                {stage}
            </span>

            {/* Upload date */}
            <p className="text-xs text-text-muted tabular-nums">{formatDate(doc.uploaded_at)}</p>

            {/* Uploader avatar */}
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 ring-2 ring-surface"
                style={{ backgroundColor: '#ff9f0a' }}
                title={doc.uploader?.name ?? 'Unknown'}>
                {initials}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-0.5">
                <button
                    title="Download"
                    className="p-1.5 rounded-md text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    onClick={handleDownload}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </button>
                <button
                    title="Delete"
                    className="p-1.5 rounded-md text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    onClick={e => { e.stopPropagation(); onDelete(doc.id); }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
