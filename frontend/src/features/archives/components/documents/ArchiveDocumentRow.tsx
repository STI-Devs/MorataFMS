import { Download, FileText, RefreshCw, Trash2 } from 'lucide-react';
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
        <div
            className="grid items-center gap-3 border-b border-border/50 px-5 py-2.5 transition-colors hover:bg-muted/40"
            style={{ gridTemplateColumns: '28px minmax(0,1fr) minmax(180px,260px) 92px' }}
        >
            {/* File type icon */}
            <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-2xs"
                style={{ backgroundColor: c.bg }}
            >
                <FileText className="h-3.5 w-3.5" style={{ color: c.color }} />
            </div>

            {/* Filename + ext/size */}
            <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground" title={doc.filename}>
                    {doc.filename}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                    <span className="font-mono">{ext.toUpperCase()} · {doc.formatted_size}</span>
                    <span className="mx-1.5">·</span>
                    <span>{formatDate(doc.uploaded_at)}</span>
                    <span className="mx-1.5">·</span>
                    <span>{doc.uploader?.name ?? 'Unknown uploader'}</span>
                </p>
            </div>

            {/* Stage pill */}
            <div className="min-w-0">
                <span
                    className="inline-flex max-w-full items-center truncate rounded-md px-2 py-0.5 text-[10px] font-semibold"
                    style={{ color: sc.color, backgroundColor: sc.bg }}
                >
                    {stage}
                </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-1">
                <div
                    className="mr-1 hidden h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-primary-foreground ring-2 ring-background sm:flex"
                    style={{ backgroundColor: 'var(--warning)' }}
                    title={doc.uploader?.name ?? 'Unknown'}
                >
                    {initials}
                </div>
                <button
                    type="button"
                    title="Download"
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                    onClick={handleDownload}
                >
                    <Download className="w-3.5 h-3.5" />
                </button>
                {canReplace && onReplace && (
                    <button
                        type="button"
                        title="Replace"
                        className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            onReplace(doc);
                        }}
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                )}
                {canDelete && onDelete && (
                    <button
                        type="button"
                        title="Delete"
                        className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(doc.id);
                        }}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
};

