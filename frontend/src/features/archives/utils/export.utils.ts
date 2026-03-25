import type { ArchiveYear, TransactionType } from '../../documents/types/document.types';
import { EXPORT_STAGES, IMPORT_STAGES, REQUIRED_EXPORT_STAGES, REQUIRED_IMPORT_STAGES } from '../../documents/types/document.types';
import { toTitleCase } from './archive.utils';

const MONTH_NAMES_FULL = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

export interface ExportFilters {
    year?: string;   // 'all' or a specific year string
    type?: string;   // 'all' | 'import' | 'export'
    status?: string; // 'all' | 'complete' | 'incomplete'
}

/**
 * Generates and triggers a CSV download of BL records filtered by the
 * current dashboard selections (year, type, status).
 */
export const exportArchiveCSV = (archiveData: ArchiveYear[], filters: ExportFilters = {}) => {
    const { year = 'all', type = 'all', status = 'all' } = filters;

    type BLEntry = {
        blNo: string;
        type: TransactionType;
        year: number;
        month: number;
        client: string;
        stages: Set<string>;
        lastUpload: string | null;
        uploader: string | null;
    };

    const blMap = new Map<string, BLEntry>();
    for (const yearData of archiveData) {
        // Year filter
        if (year !== 'all' && String(yearData.year) !== year) continue;

        for (const doc of yearData.documents) {
            // Type filter
            if (type !== 'all' && doc.type !== type) continue;

            const blNo = doc.bl_no || '(no BL)';
            const key = `${blNo}|${doc.type}|${yearData.year}`;
            if (!blMap.has(key)) {
                blMap.set(key, {
                    blNo, type: doc.type, year: yearData.year,
                    month: doc.month, client: doc.client,
                    stages: new Set(), lastUpload: null, uploader: null,
                });
            }
            const entry = blMap.get(key)!;
            entry.stages.add(doc.stage);
            if (doc.uploaded_at && (!entry.lastUpload || doc.uploaded_at > entry.lastUpload)) {
                entry.lastUpload = doc.uploaded_at;
                entry.uploader = doc.uploader?.name ?? null;
            }
        }
    }

    const importStageKeys = REQUIRED_IMPORT_STAGES.map(s => s.key) as string[];
    const exportStageKeys = REQUIRED_EXPORT_STAGES.map(s => s.key) as string[];
    const allStageKeys = [...new Set([...importStageKeys, ...exportStageKeys])];
    const stageLabels = Object.fromEntries([
        ...IMPORT_STAGES.map(s => [s.key, s.label]),
        ...EXPORT_STAGES.map(s => [s.key, s.label]),
    ]);

    const headers = [
        'BL No.', 'Type', 'Year', 'Month', 'Client',
        ...allStageKeys.map(k => stageLabels[k] ?? k.toUpperCase()),
        'Status', 'Last Upload Date', 'Uploaded By',
    ];

    const rows = [...blMap.values()]
        .filter(entry => {
            if (status === 'all') return true;
            const required = entry.type === 'import' ? importStageKeys : exportStageKeys;
            const complete = required.every(k => entry.stages.has(k));
            return status === 'complete' ? complete : !complete;
        })
        .sort((a, b) => b.year - a.year || b.month - a.month || a.blNo.localeCompare(b.blNo))
        .map(entry => {
            const required = entry.type === 'import' ? importStageKeys : exportStageKeys;
            const isComplete = required.every(k => entry.stages.has(k));
            const stageCols = allStageKeys.map(k => {
                if (!required.includes(k)) return 'N/A';
                return entry.stages.has(k) ? '✓' : '–';
            });
            return [
                entry.blNo,
                entry.type.charAt(0).toUpperCase() + entry.type.slice(1),
                String(entry.year),
                MONTH_NAMES_FULL[entry.month - 1] ?? String(entry.month),
                toTitleCase(entry.client),
                ...stageCols,
                isComplete ? 'Complete' : 'Incomplete',
                entry.lastUpload
                    ? new Date(entry.lastUpload).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—',
                entry.uploader ?? '—',
            ];
        });

    if (rows.length === 0) {
        alert('No records match the current filters to export.');
        return;
    }

    // Build filename from active filters
    const parts = ['archive-report'];
    if (year !== 'all') parts.push(year);
    if (type !== 'all') parts.push(type);
    if (status !== 'all') parts.push(status);
    parts.push(new Date().toISOString().slice(0, 10));
    const filename = parts.join('-') + '.csv';

    // Encode & download
    const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const csvContent = [
        headers.map(escape).join(','),
        ...rows.map(row => row.map(escape).join(',')),
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
