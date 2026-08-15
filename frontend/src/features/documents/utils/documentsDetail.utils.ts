import type { ApiDocument } from '../../tracking/types';
import { EXPORT_STAGES, IMPORT_STAGES } from '../types/document.types';

export type DocFileType = 'pdf' | 'docx' | 'jpg' | 'png' | 'other';

export interface TransactionDoc {
    id: number;
    name: string;
    fileType: DocFileType;
    stageKey: string;
    stageLabel: string;
    date: string;
    uploader: { name: string; initials: string; avatarColor: string };
    size: string;
}

export const TYPE_CONFIG = {
    import: { label: 'Import', color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 12%, transparent)' },
    export: { label: 'Export', color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 12%, transparent)' },
    legacy: { label: 'Legacy', color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 12%, transparent)' },
} as const;

export const AVATAR_COLORS = [
    'bg-primary', 'bg-chart-2', 'bg-success', 'bg-violet',
    'bg-warning', 'bg-danger', 'bg-sky', 'bg-chart-3',
];

export const STAGE_COLORS: Record<string, { color: string; bg: string }> = {
    boc: { color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 10%, transparent)' },
    bonds: { color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 10%, transparent)' },
    phytosanitary: { color: 'var(--chart-3)', bg: 'color-mix(in srgb, var(--chart-3) 10%, transparent)' },
    ppa: { color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
    do: { color: 'var(--violet)', bg: 'color-mix(in srgb, var(--violet) 10%, transparent)' },
    port_charges: { color: 'var(--sky)', bg: 'color-mix(in srgb, var(--sky) 10%, transparent)' },
    releasing: { color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 10%, transparent)' },
    billing: { color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 10%, transparent)' },
    docs_prep: { color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 10%, transparent)' },
    bl_generation: { color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 10%, transparent)' },
    bl: { color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 10%, transparent)' },
    co: { color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
    cil: { color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 10%, transparent)' },
    dccci: { color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 10%, transparent)' },
    others: { color: 'var(--muted-foreground)', bg: 'color-mix(in srgb, var(--muted-foreground) 10%, transparent)' },
};

const IMPORT_STAGE_LABELS = Object.fromEntries(
    IMPORT_STAGES.map((stage) => [stage.key, stage.label]),
) as Record<string, string>;

const EXPORT_STAGE_LABELS = Object.fromEntries(
    EXPORT_STAGES.map((stage) => [stage.key, stage.label]),
) as Record<string, string>;

export function toTitleCase(str: string): string {
    if (!str || str === '\u2014') return str;
    return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatDate(dateStr: string): string {
    if (!dateStr || dateStr === '\u2014') return dateStr;
    const d = new Date(`${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatStageFallback(stageKey: string): string {
    return stageKey
        .split('_')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

export function getStageLabel(stageKey: string, isImport: boolean): string {
    const labelMap = isImport ? IMPORT_STAGE_LABELS : EXPORT_STAGE_LABELS;
    return labelMap[stageKey] ?? formatStageFallback(stageKey);
}

export function getFileType(filename: string): DocFileType {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf') return 'pdf';
    if (ext === 'docx') return 'docx';
    if (ext === 'jpg' || ext === 'jpeg') return 'jpg';
    if (ext === 'png') return 'png';
    return 'other';
}

export function getInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('');
}

export function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % AVATAR_COLORS.length;
    return AVATAR_COLORS[hash];
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function mapDocument(doc: ApiDocument, isImport: boolean): TransactionDoc {
    const uploaderName = doc.uploaded_by?.name ?? 'Unknown';

    return {
        id: doc.id,
        name: doc.filename,
        fileType: getFileType(doc.filename),
        stageKey: doc.type,
        stageLabel: getStageLabel(doc.type, isImport),
        date: doc.created_at.slice(0, 10),
        uploader: {
            name: uploaderName,
            initials: getInitials(uploaderName),
            avatarColor: getAvatarColor(uploaderName),
        },
        size: doc.formatted_size || formatBytes(doc.size_bytes),
    };
}
