import { useMemo } from 'react';
import type { ApiExportTransaction, ApiImportTransaction, VesselGroup } from '../types';

const COMPLETED_STATUSES = new Set(['completed', 'Completed', 'Cleared', 'Shipped']);
const IN_PROGRESS_STATUSES = new Set([
    'Processing', 'In Progress', 'in_progress',
    'Vessel Arrived', 'In Transit', 'Departure',
]);

function isDelayedDate(dateString: string | null | undefined): boolean {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !Number.isNaN(date.getTime()) && date < new Date();
}

function buildImportGroups(transactions: ApiImportTransaction[]): VesselGroup<ApiImportTransaction>[] {
    const grouped = new Map<string, ApiImportTransaction[]>();

    for (const t of transactions) {
        const key = (t.vessel_name ?? 'Unknown Vessel').trim();
        const existing = grouped.get(key);
        if (existing) {
            existing.push(t);
        } else {
            grouped.set(key, [t]);
        }
    }

    const groups: VesselGroup<ApiImportTransaction>[] = [];

    for (const [vesselName, txns] of grouped.entries()) {
        const firstArrival = txns[0]?.arrival_date;
        const hasMixedDates = txns.some(t => t.arrival_date !== firstArrival);
        const eta = hasMixedDates ? null : (firstArrival ?? null);
        const blocked = txns.filter(t => t.open_remarks_count > 0);
        const completed = txns.filter(t => COMPLETED_STATUSES.has(t.status ?? ''));
        const in_progress = txns.filter(t => IN_PROGRESS_STATUSES.has(t.status ?? ''));

        groups.push({
            vesselKey: vesselName,
            vesselName,
            voyage: null,
            eta,
            type: 'import',
            transactions: txns,
            stats: {
                total: txns.length,
                in_progress: in_progress.length,
                blocked: blocked.length,
                completed: completed.length,
            },
            isDelayed: isDelayedDate(eta) && completed.length < txns.length,
        });
    }

    return groups.sort((a, b) => {
        if (!a.eta) return 1;
        if (!b.eta) return -1;
        return new Date(a.eta).getTime() - new Date(b.eta).getTime();
    });
}

function buildExportGroups(transactions: ApiExportTransaction[]): VesselGroup<ApiExportTransaction>[] {
    const grouped = new Map<string, ApiExportTransaction[]>();

    for (const t of transactions) {
        const key = (t.vessel ?? 'Unknown Vessel').trim();
        const existing = grouped.get(key);
        if (existing) {
            existing.push(t);
        } else {
            grouped.set(key, [t]);
        }
    }

    const groups: VesselGroup<ApiExportTransaction>[] = [];

    for (const [vesselName, txns] of grouped.entries()) {
        const firstExport = txns[0]?.export_date;
        const hasMixedDates = txns.some(t => t.export_date !== firstExport);
        const eta = hasMixedDates ? null : (firstExport ?? null);
        const blocked = txns.filter(t => t.open_remarks_count > 0);
        const completed = txns.filter(t => COMPLETED_STATUSES.has(t.status ?? ''));
        const in_progress = txns.filter(t => IN_PROGRESS_STATUSES.has(t.status ?? ''));

        groups.push({
            vesselKey: vesselName,
            vesselName,
            voyage: null,
            eta,
            type: 'export',
            transactions: txns,
            stats: {
                total: txns.length,
                in_progress: in_progress.length,
                blocked: blocked.length,
                completed: completed.length,
            },
            isDelayed: isDelayedDate(eta) && completed.length < txns.length,
        });
    }

    return groups.sort((a, b) => {
        if (!a.eta) return 1;
        if (!b.eta) return -1;
        return new Date(a.eta).getTime() - new Date(b.eta).getTime();
    });
}

export function useImportVesselGroups(transactions: ApiImportTransaction[]): VesselGroup<ApiImportTransaction>[] {
    return useMemo(() => buildImportGroups(transactions), [transactions]);
}

export function useExportVesselGroups(transactions: ApiExportTransaction[]): VesselGroup<ApiExportTransaction>[] {
    return useMemo(() => buildExportGroups(transactions), [transactions]);
}
