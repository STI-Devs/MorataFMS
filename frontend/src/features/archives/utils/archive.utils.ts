import type { ArchiveYear, TransactionType } from '../../documents/types/document.types';
import { EXPORT_STAGES, IMPORT_STAGES } from '../../documents/types/document.types';

export type DrillState =
    | { level: 'years' }
    | { level: 'types'; year: ArchiveYear }
    | { level: 'months'; year: ArchiveYear; type: TransactionType }
    | { level: 'bls'; year: ArchiveYear; type: TransactionType; month: number }
    | { level: 'files'; year: ArchiveYear; type: TransactionType; month: number; bl: string };

export type ViewMode = 'folder' | 'document';
export type DocStatusFilter = 'all' | 'complete' | 'incomplete';
export type SortKey = 'bl' | 'client' | 'period' | 'files';

const ROLE_RANK: Record<string, number> = {
    encoder: 1, broker: 2, supervisor: 3, manager: 4, admin: 5,
};
export const hasRoleAtLeast = (userRole: string | undefined, minRole: string): boolean =>
    (ROLE_RANK[userRole ?? ''] ?? 0) >= (ROLE_RANK[minRole] ?? 99);


export const FOLDER_COLOR = { import: '#16a34a', export: '#2563eb' } as const;
export const FOLDER_LABEL = { import: 'imports', export: 'exports' } as const;
export const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export const toTitleCase = (str: string) =>
    str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

export const computeGlobalCompleteness = (archiveData: ArchiveYear[]): number => {
    const blMap = new Map<string, { type: TransactionType; stages: Set<string> }>();
    for (const yearData of archiveData) {
        for (const doc of yearData.documents) {
            const key = `${doc.bl_no}|${doc.type}|${yearData.year}`;
            if (!blMap.has(key)) blMap.set(key, { type: doc.type, stages: new Set() });
            blMap.get(key)!.stages.add(doc.stage);
        }
    }
    if (blMap.size === 0) return 0;
    let complete = 0;
    for (const { type, stages } of blMap.values()) {
        const required = type === 'import' ? IMPORT_STAGES : EXPORT_STAGES;
        if (required.every(s => stages.has(s.key))) complete++;
    }
    return Math.round((complete / blMap.size) * 100);
};

export const countIncompleteBLs = (archiveData: ArchiveYear[]): number => {
    const blMap = new Map<string, { type: TransactionType; stages: Set<string> }>();
    for (const yearData of archiveData) {
        for (const doc of yearData.documents) {
            const key = `${doc.bl_no}|${doc.type}|${yearData.year}`;
            if (!blMap.has(key)) blMap.set(key, { type: doc.type, stages: new Set() });
            blMap.get(key)!.stages.add(doc.stage);
        }
    }
    let incomplete = 0;
    for (const { type, stages } of blMap.values()) {
        const required = type === 'import' ? IMPORT_STAGES : EXPORT_STAGES;
        if (!required.every(s => stages.has(s.key))) incomplete++;
    }
    return incomplete;
};
