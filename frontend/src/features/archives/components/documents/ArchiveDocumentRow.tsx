import type { ArchiveDocument } from '../../../documents/types/document.types';
import { trackingApi } from '../../../tracking/api/trackingApi';

const IMPORT_STAGE_LABELS: Record<string, string> = {
    boc:           'BOC Document Processing',
    bonds:         'BONDS',
    ppa:           'Payment for PPA Charges',
    do:            'Delivery Order Request',
    port_charges:  'Payment for Port Charges',
    releasing:     'Releasing of Documents',
    billing:       'Billing and Liquidation',
    others:        'Other Documents',
};

const EXPORT_STAGE_LABELS: Record<string, string> = {
    boc:           'BOC Document Processing',
    docs_prep:     'BOC Document Processing',
    bl_generation: 'Bill of Lading',
    bl:            'Bill of Lading',
    phytosanitary: 'Phytosanitary Certificates',
    co:            'CO Application',
    cil:           'CIL',
    dccci:         'DCCCI Printing',
    billing:       'Billing and Liquidation',
    others:        'Other Documents',
};

const STAGE_COLORS: Record<string, { color: string; bg: string }> = {
    boc:           { color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 10%, transparent)' },
    bonds:         { color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 10%, transparent)' },
    phytosanitary: { color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 10%, transparent)' },
    ppa:           { color: 'var(--info)', bg: 'color-mix(in srgb, var(--info) 10%, transparent)' },
    do:            { color: 'var(--violet)', bg: 'color-mix(in srgb, var(--violet) 10%, transparent)' },
    port_charges:  { color: 'var(--sky)', bg: 'color-mix(in srgb, var(--sky) 10%, transparent)' },
    releasing:     { color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 10%, transparent)' },
    billing:       { color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 10%, transparent)' },
    // Export stages
    docs_prep:     { color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 10%, transparent)' },
    bl_generation: { color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 10%, transparent)' },
    bl:            { color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 10%, transparent)' },
    co:            { color: 'var(--info)', bg: 'color-mix(in srgb, var(--info) 10%, transparent)' },
    cil:           { color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 10%, transparent)' },
    dccci:         { color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 10%, transparent)' },
    // Shared catch-all
    others:        { color: 'var(--muted-foreground)', bg: 'color-mix(in srgb, var(--muted-foreground) 10%, transparent)' },
};

const extFromFilename = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';

const extStyle = (ext: string) => {
    if (ext === 'pdf')  return { color: 'var(--danger)', bg: 'color-mix(in srgb, var(--danger) 10%, transparent)' };
    if (ext === 'docx') return { color: 'var(--info)', bg: 'color-mix(in srgb, var(--info) 10%, transparent)' };
    return                     { color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 10%, transparent)' };
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

const getStageLabel = (doc: ArchiveDocument): string => {
    const stageLabels = doc.type === 'import' ? IMPORT_STAGE_LABELS : EXPORT_STAGE_LABELS;

    return stageLabels[doc.stage] ?? doc.stage;
};

interface Props {
    doc: ArchiveDocument;
    onDelete?: (id: number) => void;
    canDelete?: boolean;
    onReplace?: (doc: ArchiveDocument) => void;
    canReplace?: boolean;
}

export const ArchiveDocumentRow = ({ doc, onDelete, canDelete = true, onReplace, canReplace = false }: Props) => {
    const ext = extFromFilename(doc.filename);
    const c = extStyle(ext);
    const stageKey = doc.stage in STAGE_COLORS ? doc.stage : '_';
    const sc = STAGE_COLORS[stageKey] ?? { color: 'var(--muted-foreground)', bg: 'color-mix(in srgb, var(--muted-foreground) 10%, transparent)' };
    const stage = getStageLabel(doc);
    const initials = doc.uploader ? getInitials(doc.uploader.name) : '??';

    const handleDownload = () => trackingApi.downloadDocument(doc.id, doc.filename);

    return (
        <div className="grid items-center gap-3 border-b border-border/40 px-4 py-2.5 transition-colors hover:bg-hover"
            style={{ gridTemplateColumns: '28px minmax(0,1fr) minmax(180px,260px) 92px' }}>

            {/* File type icon */}
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: c.bg }}>
                <svg className="h-3.5 w-3.5" fill="none" stroke={c.color} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            </div>

            {/* Filename + ext/size */}
            <div className="min-w-0">
                <p className="truncate text-sm font-bold text-text-primary" title={doc.filename}>
                    {doc.filename}
                </p>
                <p className="mt-0.5 truncate text-[10px] font-semibold text-text-muted">
                    <span className="font-mono">{ext.toUpperCase()} · {doc.formatted_size}</span>
                    <span className="mx-1.5">·</span>
                    <span>{formatDate(doc.uploaded_at)}</span>
                    <span className="mx-1.5">·</span>
                    <span>{doc.uploader?.name ?? 'Unknown uploader'}</span>
                </p>
            </div>

            {/* Stage pill */}
            <div className="min-w-0">
                <span className="inline-flex max-w-full items-center truncate rounded-md px-2 py-0.5 text-[10px] font-bold"
                    style={{ color: sc.color, backgroundColor: sc.bg }}>
                    {stage}
                </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-1">
                <div className="mr-1 hidden h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-black text-primary-foreground ring-2 ring-surface sm:flex"
                    style={{ backgroundColor: 'var(--warning)' }}
                    title={doc.uploader?.name ?? 'Unknown'}>
                    {initials}
                </div>
                <button
                    title="Download"
                    className="rounded-md p-1.5 text-primary transition-colors hover:bg-primary/10"
                    onClick={handleDownload}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </button>
                {canReplace && onReplace && (
                    <button
                        title="Replace"
                        className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                        onClick={e => { e.stopPropagation(); onReplace(doc); }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                )}
                {canDelete && onDelete && (
                    <button
                        title="Delete"
                        className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                        onClick={e => { e.stopPropagation(); onDelete(doc.id); }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};
