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
    import: { label: 'Import', color: '#0a84ff', bg: 'rgba(10,132,255,0.12)' },
    export: { label: 'Export', color: '#30d158', bg: 'rgba(48,209,88,0.12)' },
    legacy: { label: 'Legacy', color: '#ff9f0a', bg: 'rgba(255,159,10,0.12)' },
} as const;

export const AVATAR_COLORS = [
    'bg-blue-500', 'bg-indigo-500', 'bg-emerald-500',
    'bg-violet-500', 'bg-amber-500', 'bg-rose-500',
    'bg-cyan-500', 'bg-teal-500',
];

export const STAGE_COLORS: Record<string, { color: string; bg: string }> = {
    boc: { color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
    bonds: { color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
    phytosanitary: { color: '#0f766e', bg: 'rgba(15,118,110,0.1)' },
    ppa: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    do: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    port_charges: { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    releasing: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    billing: { color: '#ff9f0a', bg: 'rgba(255,159,10,0.1)' },
    docs_prep: { color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
    bl_generation: { color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
    bl: { color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
    co: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    cil: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    dccci: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    others: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
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
